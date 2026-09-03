import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const invoiceItemSchema = z.object({
  product: objectIdSchema.optional(),
  description: z.string().min(1, 'Item description is required').trim(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be at least 0'),
  taxRate: z.coerce
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),
});

export const createInvoiceSchema = z.object({
  customer: objectIdSchema,
  invoiceNumber: z.string().trim().optional(),
  status: z
    .enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .optional()
    .default('DRAFT')
    .transform((val) => val.toUpperCase()),
  issueDate: z.coerce.date().default(() => new Date()),
  dueDate: z.coerce.date().default(() => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
  discount: z.coerce.number().min(0, 'Discount must be positive').default(0),
  notes: z.string().optional().default(''),
});

export const updateInvoiceSchema = z.object({
  customer: objectIdSchema.optional(),
  invoiceNumber: z.string().trim().optional(),
  status: z
    .enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .optional()
    .transform((val) => val ? val.toUpperCase() : undefined),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required').optional(),
  discount: z.coerce.number().min(0, 'Discount must be positive').optional(),
  notes: z.string().optional(),
});

export const invoiceQuerySchema = z.object({
  status: z.string().optional(),
  customer: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;

