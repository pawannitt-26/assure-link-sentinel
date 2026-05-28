import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { scheduledReportService } from '../services/scheduledReportService.js';
import { authenticate } from '../middleware/auth.js';

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(200).default(20),
  enabled: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

const idParam = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  name: z.string().min(1).max(255),
  reportType: z.enum([
    'compliance_summary',
    'risk_assessment',
    'finding_report',
    'partner_audit',
    'full_assurance',
  ]),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  executionHour: z.number().int().min(0).max(23),
  dayOfWeekOrMonth: z.string().min(1).max(20),
  timezone: z.string().max(100).optional(),
  deliveryEndpoint: z.string().max(1000).optional(),
  enabled: z.boolean().optional(),
  nextExecutionAt: z.string().datetime().optional(),
});

const updateSchema = createSchema.partial();

const route: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate);

  app.get('/scheduled-reports', async (req) => {
    const q = listQuery.parse(req.query);
    const result = await scheduledReportService.list(q);
    return { success: true, data: result };
  });

  app.get('/scheduled-reports/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const item = await scheduledReportService.getById(id);
    return { success: true, data: item };
  });

  app.post('/scheduled-reports', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const created = await scheduledReportService.create(body);
    reply.status(201).send({ success: true, data: created });
  });

  app.patch('/scheduled-reports/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateSchema.parse(req.body);
    const updated = await scheduledReportService.update(id, body);
    return { success: true, data: updated };
  });

  app.delete('/scheduled-reports/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const result = await scheduledReportService.remove(id);
    return { success: true, data: result };
  });
};

export default route;
