import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required')
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  if (process.env.NODE_ENV === 'test') {
    return {
      PORT: 3000,
      NODE_ENV: 'test',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'test-dummy-key'
    };
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Environment configuration error. Please check your .env file.');
  }
  return result.data;
}
