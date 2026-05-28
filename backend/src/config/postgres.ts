import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { DbClient } from '../lib/dbClient.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const isLocal =
      env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1');
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected PostgreSQL pool error');
    });
    logger.info('PostgreSQL pool initialized');
  }
  return pool;
}

let _db: DbClient | null = null;

export function getDb(): DbClient {
  if (!_db) {
    _db = new DbClient(getPool());
  }
  return _db;
}

/** @deprecated Use getDb() — kept as alias for minimal service churn */
export const supabase = getDb();

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    _db = null;
    logger.info('PostgreSQL pool closed');
  }
}
