import { FastifyPluginAsync } from 'fastify';
import { dashboardService } from '../services/dashboardService.js';
import { authenticate } from '../middleware/auth.js';

const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate);

  app.get('/dashboard/stats', async () => {
    const data = await dashboardService.getStats();
    return { success: true, data };
  });
};

export default dashboardRoutes;