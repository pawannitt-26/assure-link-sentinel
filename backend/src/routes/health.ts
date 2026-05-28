import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../config/postgres.js';

const healthRoute: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    let database = 'connected';
    try {
      const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') database = 'degraded';
    } catch {
      database = 'disconnected';
    }
    return {
      status: database === 'disconnected' ? 'error' : 'ok',
      database,
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  });
};

export default healthRoute;