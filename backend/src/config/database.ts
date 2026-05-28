import { supabase } from './supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Database connection layer — now backed by Supabase.
 * We perform a lightweight ping by querying a known system view / table.
 */
export async function connectDatabase(): Promise<void> {
  try {
    // Ping by selecting from users (head request, no rows)
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows; any other error is a connectivity/schema issue
      logger.warn({ err: error }, '⚠️ Supabase connectivity check returned an error (table may not exist yet)');
    } else {
      logger.info('✅ Supabase connection verified');
    }
  } catch (err) {
    logger.error({ err }, '❌ Supabase connection failed');
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  // Supabase JS client uses HTTP — nothing persistent to close
  logger.info('🛑 Supabase client released');
}

export { supabase };