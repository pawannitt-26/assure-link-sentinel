import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { crmLogService } from '../services/crmLogService';
import { authenticate } from '../middleware/auth';

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(200).default(20),
  partnerId: z.string().uuid().optional(),
  status: z.enum(['pending', 'sent', 'confirmed', 'failed']).optional(),
});

const idParam = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  partnerId: z.string().uuid(),
  complianceRunId: z.string().uuid().optional(),
  updateType: z.enum(['compliance_status', 'risk_assessment', 'finding_note', 'alert']),
  payload: z.any(),
  status: z.enum(['pending', 'sent', 'confirmed', 'failed']).optional(),
  externalRecordId: z.string().optional(),
  errorMessage: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({
  sentAt: z.string().datetime().optional(),
});

const route: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate);

  app.get('/crm-logs', async (req) => {
    const q = listQuery.parse(req.query);
    const result = await crmLogService.list(q);
    return { success: true, data: result };
  });

  app.get('/crm-logs/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const item = await crmLogService.getById(id);
    return { success: true, data: item };
  });

  app.post('/crm-logs', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const created = await crmLogService.create(body);
    reply.status(201).send({ success: true, data: created });
  });

  app.patch('/crm-logs/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateSchema.parse(req.body);
    const updated = await crmLogService.update(id, {
      ...body,
      sentAt: body.sentAt ? new Date(body.sentAt) : undefined,
    });
    return { success: true, data: updated };
  });

  app.delete('/crm-logs/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const result = await crmLogService.remove(id);
    return { success: true, data: result };
  });
};

export default route;
