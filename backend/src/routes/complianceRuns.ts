import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { complianceRunService } from '../services/complianceRunService.js';
import { authenticate } from '../middleware/auth.js';

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(200).default(20),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
});

const idParam = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  name: z.string().min(1),
  complianceThreshold: z.enum(['strict', 'standard', 'relaxed']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
  executiveSummary: z.string().optional(),
  additionalNotes: z.string().optional(),
  criticalCount: z.number().int().min(0).optional(),
  highCount: z.number().int().min(0).optional(),
  mediumCount: z.number().int().min(0).optional(),
  lowCount: z.number().int().min(0).optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

const updateSchema = createSchema.partial();

const route: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate);

  app.get('/compliance-runs', async (req) => {
    const q = listQuery.parse(req.query);
    const result = await complianceRunService.list(q);
    return { success: true, data: result };
  });

  app.get('/compliance-runs/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const data = await complianceRunService.getById(id);
    return { success: true, data };
  });

  app.post('/compliance-runs', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const data = await complianceRunService.create(body);
    return reply.status(201).send({ success: true, data });
  });

  app.put('/compliance-runs/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateSchema.parse(req.body);
    const data = await complianceRunService.update(id, body);
    return { success: true, data };
  });

  app.delete('/compliance-runs/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const data = await complianceRunService.remove(id);
    return { success: true, data };
  });
};

export default route;