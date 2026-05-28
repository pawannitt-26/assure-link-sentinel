import fs from 'fs';
import path from 'path';
import type pg from 'pg';
import { logger } from '../utils/logger.js';

const MIGRATIONS_TABLE = '_schema_migrations';

function resolveMigrationsDir(): string {
  const candidates = [
    process.env.MIGRATIONS_DIR,
    path.join(process.cwd(), 'db/migrations'),
    path.join(process.cwd(), '../db/migrations'),
  ].filter((p): p is string => Boolean(p));

  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return dir;
    }
  }

  throw new Error(
    `Migrations directory not found. Tried: ${candidates.join(', ')}`,
  );
}

function listMigrationFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

async function ensureMigrationsTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.${MIGRATIONS_TABLE} (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function isApplied(client: pg.PoolClient, name: string): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM public.${MIGRATIONS_TABLE} WHERE name = $1 LIMIT 1`,
    [name],
  );
  return result.rowCount !== null && result.rowCount > 0;
}

async function recordMigration(client: pg.PoolClient, name: string): Promise<void> {
  await client.query(
    `INSERT INTO public.${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
    [name],
  );
}

export async function runMigrations(pool: pg.Pool): Promise<void> {
  const dir = resolveMigrationsDir();
  const files = listMigrationFiles(dir);

  if (files.length === 0) {
    logger.warn({ dir }, 'No SQL migration files found');
    return;
  }

  logger.info({ dir, count: files.length }, 'Checking database migrations');

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);

    for (const file of files) {
      const alreadyApplied = await isApplied(client, file);
      if (alreadyApplied) {
        logger.debug({ file }, 'Migration already applied, skipping');
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      logger.info({ file }, 'Applying migration');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await recordMigration(client, file);
        await client.query('COMMIT');
        logger.info({ file }, 'Migration applied');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
}
