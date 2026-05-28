import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { findingService } from '../services/findingService.js';
import { authenticate } from '../middleware/auth.js';

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(200).default(20),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'dismissed']).optional(),
  partnerId: z.string().uuid().optional(),
  complianceRunId: z.string().uuid().optional(),
});

const idParam = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  complianceRunId: z.string().uuid(),
  partnerId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  riskCategory: z.enum(['financial', 'documentation', 'transaction', 'audit', 'data_integrity']),
  affectedRecord: z.string().optional(),
  recommendedAction: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'dismissed']).optional(),
  resolutionNotes: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
});

const updateSchema = createSchema.partial();

const route: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate);

  app.get('/findings', async (req) => {
    const q = listQuery.parse(req.query);
    const result = await findingService.list(q);
    return { success: true, data: result };
  });

  app.get('/findings/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const data = await findingService.getById(id);
    return { success: true, data };
  });

  app.post('/findings', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const data = await findingService.create(body);
    return reply.status(201).send({ success: true, data });
  });

  app.put('/findings/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateSchema.parse(req.body);
    const data = await findingService.update(id, body);
    return { success: true, data };
  });

  app.delete('/findings/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const data = await findingService.remove(id);
    return { success: true, data };
  });
};

export default route;