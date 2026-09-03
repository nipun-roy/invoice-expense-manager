import mongoose, { Document, Schema } from 'mongoose';
import { PaymentMethodEnum } from './Expense.js';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  invoice: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  method: PaymentMethodEnum;
  notes?: string;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: Object.values(PaymentMethodEnum),
      default: PaymentMethodEnum.BANK_TRANSFER,
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
