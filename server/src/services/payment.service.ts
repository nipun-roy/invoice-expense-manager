import { Payment, IPayment } from '../models/Payment.js';
import { Invoice, InvoiceStatusEnum, IInvoice } from '../models/Invoice.js';
import {
  CreatePaymentInput,
  PaymentQueryInput,
} from '../validators/payment.validator.js';
import { parseDateRange } from '../utils/dateRange.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const recordPayment = async (
  userId: string,
  data: CreatePaymentInput
): Promise<{ payment: IPayment; invoice: IInvoice }> => {
  const invoice = await Invoice.findOne({
    _id: data.invoice,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!invoice) {
    throw new AppError('Invoice not found or access denied', 404);
  }

  if (invoice.status === InvoiceStatusEnum.CANCELLED) {
    throw new AppError('Cannot record payments against cancelled invoices', 400);
  }

  if (invoice.amountDue <= 0 || invoice.status === InvoiceStatusEnum.PAID) {
    throw new AppError('This invoice is already paid in full', 400);
  }

  const paymentAmount = round2(data.amount);

  // Prevent overpayments
  if (paymentAmount > invoice.amountDue) {
    throw new AppError(
      `Payment amount (${paymentAmount.toFixed(2)}) exceeds remaining balance due (${invoice.amountDue.toFixed(2)})`,
      400
    );
  }

  const payment = await Payment.create({
    user: new mongoose.Types.ObjectId(userId),
    invoice: invoice._id,
    amount: paymentAmount,
    date: data.date || new Date(),
    method: data.method,
    notes: data.notes || '',
  });

  // Calculate sum of all payments for this invoice
  const allPayments = await Payment.find({
    invoice: invoice._id,
    user: new mongoose.Types.ObjectId(userId),
  });

  const totalPaid = round2(allPayments.reduce((sum, p) => sum + p.amount, 0));
  invoice.amountPaid = totalPaid;
  invoice.amountDue = Math.max(0, round2(invoice.grandTotal - totalPaid));

  if (invoice.amountDue <= 0) {
    invoice.status = InvoiceStatusEnum.PAID;
  } else if (invoice.status === InvoiceStatusEnum.DRAFT) {
    invoice.status = InvoiceStatusEnum.SENT;
  }

  await invoice.save();

  return { payment, invoice };
};

export const getPayments = async (
  userId: string,
  query: PaymentQueryInput
) => {
  const filter: Record<string, any> = {
    user: new mongoose.Types.ObjectId(userId),
  };

  if (query.invoice && mongoose.Types.ObjectId.isValid(query.invoice)) {
    filter.invoice = new mongoose.Types.ObjectId(query.invoice);
  }

  const dateRange = parseDateRange(
    query.dateFilter,
    query.startDate,
    query.endDate
  );
  if (dateRange) {
    filter.date = { $gte: dateRange.startDate, $lte: dateRange.endDate };
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [payments, total, totalAgg] = await Promise.all([
    Payment.find(filter)
      .populate('invoice', 'invoiceNumber grandTotal status customer')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
    Payment.aggregate([
      { $match: filter },
      { $group: { _id: null, sumAmount: { $sum: '$amount' } } },
    ]),
  ]);

  const totalCollected = totalAgg.length > 0 ? round2(totalAgg[0].sumAmount) : 0;

  return {
    payments,
    totalCollected,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getPaymentById = async (
  userId: string,
  paymentId: string
): Promise<IPayment> => {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new AppError('Invalid payment ID', 400);
  }

  const payment = await Payment.findOne({
    _id: paymentId,
    user: new mongoose.Types.ObjectId(userId),
  }).populate('invoice');

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  return payment;
};

