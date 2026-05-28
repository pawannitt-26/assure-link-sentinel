import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
});

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await authService.login(body.email, body.password);
    const token = app.jwt.sign({ sub: user.id, email: user.email });
    return reply.send({ success: true, data: { token, user } });
  });

  app.post('/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const user = await authService.register(body.email, body.password, body.fullName);
    const token = app.jwt.sign({ sub: user.id, email: user.email });
    return reply.status(201).send({ success: true, data: { token, user } });
  });

  app.get('/auth/me', { preHandler: authenticate }, async (req) => {
    const sub = (req.user as any).sub as string;
    const user = await authService.getById(sub);
    return { success: true, data: user };
  });
};

export default authRoutes;