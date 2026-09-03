import mongoose, { Document, Schema } from 'mongoose';

export enum InvoiceStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface IInvoiceItem {
  product?: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface IInvoice extends Document {
  user: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  invoiceNumber: string;
  status: InvoiceStatusEnum;
  issueDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: false },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  total: { type: Number, required: true },
});

const invoiceSchema = new Schema<IInvoice>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    invoiceNumber: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(InvoiceStatusEnum),
      default: InvoiceStatusEnum.DRAFT,
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, required: true },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
