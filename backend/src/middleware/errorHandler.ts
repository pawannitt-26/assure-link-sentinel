import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(error: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.flatten() },
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    });
  }

  const fErr = error as FastifyError;
  if (fErr.statusCode && fErr.statusCode < 500) {
    return reply.status(fErr.statusCode).send({
      success: false,
      error: { code: fErr.code || 'BAD_REQUEST', message: fErr.message },
    });
  }

  logger.error({ err: error, url: req.url, method: req.method }, 'Unhandled error');
  return reply.status(500).send({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}