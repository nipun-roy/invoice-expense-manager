import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseCategory extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseCategorySchema = new Schema<IExpenseCategory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseCategorySchema.index({ user: 1, name: 1 }, { unique: true });

export const ExpenseCategory = mongoose.model<IExpenseCategory>(
  'ExpenseCategory',
  expenseCategorySchema
);
