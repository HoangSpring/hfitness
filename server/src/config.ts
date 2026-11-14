import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AI_PROVIDER: z.enum(['gemini', 'fake']).default('gemini'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_VISION_MODEL: z.string().optional(),
  AI_FALLBACK_MODEL: z.string().optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().min(30_000).max(120_000).default(75_000),
  AI_THINKING_BUDGET: z.coerce.number().int().min(0).max(32_768).optional(),
  AI_DAILY_LIMIT: z.coerce.number().int().positive().default(10),
  AI_COACH_DAILY_LIMIT: z.coerce.number().int().positive().default(20),
  AI_SCAN_DAILY_LIMIT: z.coerce.number().int().positive().default(10),
});

const testDefaults = process.env.NODE_ENV === 'test'
  ? {
      SUPABASE_URL: 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      AI_PROVIDER: 'fake',
      AI_API_KEY: 'test-ai-key',
      AI_MODEL: 'test-model',
      AI_VISION_MODEL: 'test-vision-model',
    }
  : {};

export const config = configSchema.parse({ ...testDefaults, ...process.env });
