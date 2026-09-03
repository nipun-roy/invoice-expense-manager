import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').trim(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')).default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;

