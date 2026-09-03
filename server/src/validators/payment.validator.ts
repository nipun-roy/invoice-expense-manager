import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const createPaymentSchema = z.object({
  invoice: objectIdSchema,
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  date: z.coerce.date().default(() => new Date()),
  method: z
    .enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'PAYPAL', 'STRIPE', 'OTHER'])
    .default('BANK_TRANSFER'),
  notes: z.string().optional().default(''),
});

export const paymentQuerySchema = z.object({
  invoice: objectIdSchema.optional(),
  dateFilter: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;

