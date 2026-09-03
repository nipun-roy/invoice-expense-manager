import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  unit: string;
  taxRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'item' },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);
