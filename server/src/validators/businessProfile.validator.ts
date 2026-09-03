import { z } from 'zod';

export const updateBusinessProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').trim(),
  logoUrl: z.string().optional().default(''),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).default(''),
  website: z.string().optional().default(''),
  taxVatNumber: z.string().optional().default(''),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required').trim().default('INV-'),
  defaultCurrency: z.string().min(1, 'Default currency is required').trim().default('BDT'),
});

export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;

