import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessProfile extends Document {
  user: mongoose.Types.ObjectId;
  businessName: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxVatNumber?: string;
  invoicePrefix: string;
  defaultCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

const businessProfileSchema = new Schema<IBusinessProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    logoUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    taxVatNumber: { type: String, default: '' },
    invoicePrefix: { type: String, default: 'INV-', trim: true },
    defaultCurrency: { type: String, default: 'BDT', trim: true },
  },
  {
    timestamps: true,
  }
);

export const BusinessProfile = mongoose.model<IBusinessProfile>(
  'BusinessProfile',
  businessProfileSchema
);
