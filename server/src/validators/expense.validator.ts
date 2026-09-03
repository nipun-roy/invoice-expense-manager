import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Expense title is required').trim(),
  category: objectIdSchema,
  amount: z.coerce.number().positive('Expense amount must be greater than 0'),
  date: z.coerce.date().default(() => new Date()),
  paymentMethod: z
    .enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'PAYPAL', 'STRIPE', 'OTHER'])
    .default('BANK_TRANSFER'),
  receiptUrl: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  dateFilter: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;

