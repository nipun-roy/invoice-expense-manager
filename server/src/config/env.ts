import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/invoice_expense_manager'),
  JWT_SECRET: z.string().default('development_jwt_secret_key'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
