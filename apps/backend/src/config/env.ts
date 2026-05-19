import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MS: z.coerce.number().default(172_800_000), // 48 hours
  REFRESH_TOKEN_TTL_MS: z.coerce.number().default(604_800_000),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url().default('http://localhost:5000'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_DISPLAY_NAME: z.string().optional(),
  ADMIN_USERNAME: z.string().min(3).max(20).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
