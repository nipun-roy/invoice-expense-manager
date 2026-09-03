import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  OTHER = 'OTHER',
}

export interface IExpense extends Document {
  user: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethodEnum;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethodEnum),
      default: PaymentMethodEnum.BANK_TRANSFER,
    },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
