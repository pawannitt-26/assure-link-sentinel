import { getPool, closePool } from './postgres.js';
import { runMigrations } from './migrate.js';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
  try {
    const pool = getPool();

    if (env.RUN_MIGRATIONS) {
      await runMigrations(pool);
    }

    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      logger.info('PostgreSQL connection verified');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error({ err }, 'PostgreSQL connection failed');
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await closePool();
}

export { getDb as supabase } from './postgres.js';
