import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
