import type { Pool } from 'pg';

type DbError = { message: string; code?: string };
type DbResult<T> = { data: T; count: number | null; error: DbError | null };

interface SelectOptions {
  count?: 'exact';
  head?: boolean;
}

function buildFilters(filters: Array<{ column: string; op: '=' | 'ilike'; value: unknown }>, orGroups: Array<Array<{ column: string; value: string }>>) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  for (const f of filters) {
    params.push(f.value);
    if (f.op === 'ilike') {
      clauses.push(`${f.column} ILIKE $${params.length}`);
    } else {
      clauses.push(`${f.column} = $${params.length}`);
    }
  }

  for (const group of orGroups) {
    const orParts: string[] = [];
    for (const g of group) {
      params.push(g.value);
      orParts.push(`${g.column} ILIKE $${params.length}`);
    }
    clauses.push(`(${orParts.join(' OR ')})`);
  }

  return {
    sql: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

class SelectQuery {
  private columns = '*';
  private countExact = false;
  private headOnly = false;
  protected filters: Array<{ column: string; op: '=' | 'ilike'; value: unknown }> = [];
  protected orGroups: Array<Array<{ column: string; value: string }>> = [];
  private orderColumn?: string;
  private orderAsc = true;
  private rangeFrom?: number;
  private rangeTo?: number;
  private limitN?: number;
  private singleRow = false;
  private wantMaybeSingle = false;

  constructor(
    protected pool: Pool,
    protected table: string,
  ) {}

  select(columns: string, options?: SelectOptions): this {
    this.columns = columns;
    if (options?.count === 'exact') this.countExact = true;
    if (options?.head) this.headOnly = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: '=', value });
    return this;
  }

  or(clause: string): this {
    const parts = clause.split(',');
    const group: Array<{ column: string; value: string }> = [];
    for (const part of parts) {
      const match = part.trim().match(/^(\w+)\.ilike\.(.+)$/);
      if (match) {
        group.push({ column: match[1], value: match[2] });
      }
    }
    if (group.length) this.orGroups.push(group);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this.orderColumn = column;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  range(from: number, to: number): this {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  single(): this {
    this.singleRow = true;
    return this;
  }

  maybeSingle(): this {
    this.wantMaybeSingle = true;
    return this;
  }

  then<TResult1 = DbResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  protected getWhere() {
    return buildFilters(this.filters, this.orGroups);
  }

  async execute(): Promise<DbResult<unknown>> {
    try {
      const { sql: whereSql, params } = this.getWhere();

      if (this.headOnly) {
        const countSql = `SELECT COUNT(*)::int AS count FROM ${this.table}${whereSql}`;
        const countRes = await this.pool.query(countSql, params);
        const count = countRes.rows[0]?.count ?? 0;
        return { data: null, count, error: null };
      }

      let sql = `SELECT ${this.columns} FROM ${this.table}${whereSql}`;
      if (this.orderColumn) {
        sql += ` ORDER BY ${this.orderColumn} ${this.orderAsc ? 'ASC' : 'DESC'}`;
      }
      if (this.rangeFrom !== undefined && this.rangeTo !== undefined) {
        const limit = this.rangeTo - this.rangeFrom + 1;
        sql += ` LIMIT ${limit} OFFSET ${this.rangeFrom}`;
      } else if (this.limitN !== undefined) {
        sql += ` LIMIT ${this.limitN}`;
      }

      const result = await this.pool.query(sql, params);
      let count: number | null = null;
      if (this.countExact) {
        const countSql = `SELECT COUNT(*)::int AS count FROM ${this.table}${whereSql}`;
        const countRes = await this.pool.query(countSql, params);
        count = countRes.rows[0]?.count ?? 0;
      }

      if (this.singleRow || this.wantMaybeSingle) {
        const row = result.rows[0] ?? null;
        if (this.singleRow && !row) {
          return { data: null, count, error: { message: 'No rows found', code: 'PGRST116' } };
        }
        return { data: row, count, error: null };
      }

      return { data: result.rows, count, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Database error';
      return { data: null, count: null, error: { message } };
    }
  }
}

class InsertQuery {
  private returning = '*';

  constructor(
    private pool: Pool,
    private table: string,
    private row: Record<string, unknown>,
  ) {}

  select(columns: string): this {
    this.returning = columns;
    return this;
  }

  single(): this {
    return this;
  }

  then<TResult1 = DbResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<DbResult<unknown>> {
    try {
      const keys = Object.keys(this.row);
      const values = keys.map((k) => this.row[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${this.returning}`;
      const result = await this.pool.query(sql, values);
      const row = result.rows[0] ?? null;
      if (!row) {
        return { data: null, count: null, error: { message: 'Insert returned no rows' } };
      }
      return { data: row, count: null, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Database error';
      return { data: null, count: null, error: { message } };
    }
  }
}

class UpdateQuery extends SelectQuery {
  private payload: Record<string, unknown>;

  constructor(pool: Pool, table: string, payload: Record<string, unknown>) {
    super(pool, table);
    this.payload = payload;
  }

  override then<TResult1 = DbResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.executeUpdate().then(onfulfilled, onrejected);
  }

  private async executeUpdate(): Promise<DbResult<unknown>> {
    try {
      const keys = Object.keys(this.payload);
      const setParts = keys.map((k, i) => `${k} = $${i + 1}`);
      const values = keys.map((k) => this.payload[k]);

      const { sql: whereSql, params: whereParams } = this.getWhere();
      const offset = values.length;
      const whereClause = whereSql
        ? whereSql.replace(/^ WHERE /, '').replace(/\$(\d+)/g, (_, n) => `$${Number(n) + offset}`)
        : '';

      const sql = `UPDATE ${this.table} SET ${setParts.join(', ')}${
        whereClause ? ` WHERE ${whereClause}` : ''
      } RETURNING *`;

      const result = await this.pool.query(sql, [...values, ...whereParams]);
      const row = result.rows[0] ?? null;
      if (!row) {
        return { data: null, count: null, error: { message: 'No rows found', code: 'PGRST116' } };
      }
      return { data: row, count: null, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Database error';
      return { data: null, count: null, error: { message } };
    }
  }
}

class DeleteQuery {
  private filters: Array<{ column: string; value: unknown }> = [];

  constructor(
    private pool: Pool,
    private table: string,
  ) {}

  eq(column: string, value: unknown): this {
    this.filters.push({ column, value });
    return this;
  }

  then<TResult1 = DbResult<null>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<DbResult<null>> {
    try {
      const clauses: string[] = [];
      const params: unknown[] = [];
      for (const f of this.filters) {
        params.push(f.value);
        clauses.push(`${f.column} = $${params.length}`);
      }
      const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
      await this.pool.query(`DELETE FROM ${this.table}${where}`, params);
      return { data: null, count: null, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Database error';
      return { data: null, count: null, error: { message } };
    }
  }
}

class TableClient {
  constructor(
    private pool: Pool,
    private table: string,
  ) {}

  select(columns = '*', options?: SelectOptions): SelectQuery {
    const q = new SelectQuery(this.pool, this.table);
    return q.select(columns, options);
  }

  insert(row: Record<string, unknown>): InsertQuery {
    return new InsertQuery(this.pool, this.table, row);
  }

  update(row: Record<string, unknown>): UpdateQuery {
    return new UpdateQuery(this.pool, this.table, row);
  }

  delete(): DeleteQuery {
    return new DeleteQuery(this.pool, this.table);
  }
}

export class DbClient {
  constructor(private pool: Pool) {}

  from(table: string): TableClient {
    return new TableClient(this.pool, table);
  }
}
