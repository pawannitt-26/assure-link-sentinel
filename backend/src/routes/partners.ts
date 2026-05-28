import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { partnerService } from '../services/partnerService.js';
import { authenticate } from '../middleware/auth.js';

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(200).default(20),
  search: z.string().optional(),
  status: z.enum(['compliant', 'non_compliant', 'under_review', 'pending']).optional(),
});

const idParam = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().min(1),
  complianceStatus: z.enum(['compliant', 'non_compliant', 'under_review', 'pending']).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  auditStatus: z.enum(['not_started', 'in_progress', 'completed', 'overdue']).optional(),
  externalCrmId: z.string().optional(),
  notes: z.string().optional(),
  lastAuditDate: z.string().datetime().optional(),
});

const updateSchema = createSchema.partial();

const partnerRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate);

  app.get('/partners', async (req) => {
    const q = listQuery.parse(req.query);
    const result = await partnerService.list(q);
    return { success: true, data: result };
  });

  app.get('/partners/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const data = await partnerService.getById(id);
    return { success: true, data };
  });

  app.post('/partners', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const data = await partnerService.create(body);
    return reply.status(201).send({ success: true, data });
  });

  app.put('/partners/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateSchema.parse(req.body);
    const data = await partnerService.update(id, body);
    return { success: true, data };
  });

  app.delete('/partners/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const data = await partnerService.remove(id);
    return { success: true, data };
  });
};

export default partnerRoutes;