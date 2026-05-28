import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { documentService } from '../services/documentService.js';
import { authenticate } from '../middleware/auth.js';

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(200).default(20),
  partnerId: z.string().uuid().optional(),
});

const idParam = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  partnerId: z.string().uuid(),
  fileName: z.string().min(1),
  fileType: z.enum(['pdf', 'spreadsheet', 'questionnaire', 'audit_report', 'other']),
  filePath: z.string().min(1),
  fileSizeBytes: z.coerce.number().int().min(0),
  mimeType: z.string().min(1),
  processingStatus: z.enum(['pending', 'processed', 'failed']).optional(),
  extractedContent: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

const route: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate);

  app.get('/documents', async (req) => {
    const q = listQuery.parse(req.query);
    const result = await documentService.list(q);
    return { success: true, data: result };
  });

  app.get('/documents/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const data = await documentService.getById(id);
    return { success: true, data };
  });

  app.post('/documents', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const data = await documentService.create(body);
    return reply.status(201).send({ success: true, data });
  });

  app.put('/documents/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateSchema.parse(req.body);
    const data = await documentService.update(id, body);
    return { success: true, data };
  });

  app.delete('/documents/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const data = await documentService.remove(id);
    return { success: true, data };
  });
};

export default route;