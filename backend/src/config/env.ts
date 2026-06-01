import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().default('0.0.0.0'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  RUN_MIGRATIONS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed');
}

export const env = parsed.data;
export type Env = typeof env;

export function parseCorsOrigins(origins: string): string | string[] {
  const list = origins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 1 ? list[0]! : list;
}
