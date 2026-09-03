import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product/Service name is required').trim(),
  description: z.string().optional().default(''),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  unit: z.string().trim().default('item'),
  taxRate: z.coerce
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false', 'all'])
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;

