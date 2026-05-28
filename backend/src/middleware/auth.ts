import { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../utils/errors.js';

export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();
  } catch {
    throw new UnauthorizedError('Invalid or missing token');
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: { sub: string; email: string };
  }
}