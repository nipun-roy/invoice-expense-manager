import { Invoice, IInvoice, InvoiceStatusEnum } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceQueryInput,
} from '../validators/invoice.validator.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

// Safe server-side financial calculations
export const calculateInvoiceTotals = (
  items: Array<{ quantity: number; unitPrice: number; taxRate?: number }>,
  discountInput: number = 0
) => {
  let subtotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const tax = Number(item.taxRate || 0);

    const lineSubtotal = round2(qty * price);
    const lineTax = round2(lineSubtotal * (tax / 100));
    const lineTotal = round2(lineSubtotal + lineTax);

    subtotal = round2(subtotal + lineSubtotal);
    taxTotal = round2(taxTotal + lineTax);

    return {
      quantity: qty,
      unitPrice: price,
      taxRate: tax,
      total: lineTotal,
    };
  });

  const discount = Math.max(0, round2(Number(discountInput) || 0));
  const grandTotal = Math.max(0, round2(subtotal - discount + taxTotal));

  return {
    processedItems,
    subtotal,
    taxTotal,
    discount,
    grandTotal,
  };
};

export const generateNextInvoiceNumber = async (userId: string): Promise<string> => {
  const profile = await BusinessProfile.findOne({ user: userId });
  const prefix = profile?.invoicePrefix?.trim() || 'INV-';

  // Count existing invoices to generate sequential number
  const count = await Invoice.countDocuments({ user: new mongoose.Types.ObjectId(userId) });
  let seq = count + 1;
  let invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;

  // Ensure collision avoidance
  while (
    await Invoice.exists({
      user: new mongoose.Types.ObjectId(userId),
      invoiceNumber,
    })
  ) {
    seq++;
    invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
  }

  return invoiceNumber;
};

export const createInvoice = async (
  userId: string,
  data: CreateInvoiceInput
): Promise<IInvoice> => {
  // Validate customer ownership
  const customer = await Customer.findOne({
    _id: data.customer,
    user: new mongoose.Types.ObjectId(userId),
  });
  if (!customer) {
    throw new AppError('Customer not found or access denied', 404);
  }

  // Invoice Number: generate if not supplied or verify uniqueness
  let invoiceNumber = data.invoiceNumber?.trim();
  if (!invoiceNumber) {
    invoiceNumber = await generateNextInvoiceNumber(userId);
  } else {
    const existing = await Invoice.exists({
      user: new mongoose.Types.ObjectId(userId),
      invoiceNumber,
    });
    if (existing) {
      throw new AppError(`Invoice number "${invoiceNumber}" is already in use`, 400);
    }
  }

  // Safe server-side computation
  const calc = calculateInvoiceTotals(data.items, data.discount);

  const status = (data.status as InvoiceStatusEnum) || InvoiceStatusEnum.DRAFT;
  const amountPaid = status === InvoiceStatusEnum.PAID ? calc.grandTotal : 0;
  const amountDue = Math.max(0, round2(calc.grandTotal - amountPaid));

  const invoiceItems = data.items.map((item, index) => ({
    product: item.product ? new mongoose.Types.ObjectId(item.product) : undefined,
    description: item.description,
    quantity: calc.processedItems[index].quantity,
    unitPrice: calc.processedItems[index].unitPrice,
    taxRate: calc.processedItems[index].taxRate,
    total: calc.processedItems[index].total,
  }));

  const invoice = await Invoice.create({
    user: new mongoose.Types.ObjectId(userId),
    customer: new mongoose.Types.ObjectId(data.customer),
    invoiceNumber,
    status,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    items: invoiceItems,
    subtotal: calc.subtotal,
    discount: calc.discount,
    taxTotal: calc.taxTotal,
    grandTotal: calc.grandTotal,
    amountPaid,
    amountDue,
    notes: data.notes || '',
  });

  return invoice;
};

export const getInvoices = async (
  userId: string,
  query: InvoiceQueryInput
) => {
  const filter: Record<string, any> = { user: new mongoose.Types.ObjectId(userId) };

  if (query.status && query.status !== 'ALL') {
    filter.status = query.status.toUpperCase();
  }

  if (query.customer && mongoose.Types.ObjectId.isValid(query.customer)) {
    filter.customer = new mongoose.Types.ObjectId(query.customer);
  }

  if (query.search && query.search.trim() !== '') {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ invoiceNumber: searchRegex }, { notes: searchRegex }];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  return {
    invoices,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getInvoiceById = async (
  userId: string,
  invoiceId: string
): Promise<IInvoice> => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new AppError('Invalid invoice ID', 400);
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    user: new mongoose.Types.ObjectId(userId),
  })
    .populate('customer')
    .populate('items.product', 'name price unit');

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  return invoice;
};

export const updateInvoice = async (
  userId: string,
  invoiceId: string,
  data: UpdateInvoiceInput
): Promise<IInvoice> => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new AppError('Invalid invoice ID', 400);
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  // Only DRAFT invoices can be updated
  if (invoice.status !== InvoiceStatusEnum.DRAFT) {
    throw new AppError(
      `Cannot modify invoice in "${invoice.status}" status. Only draft invoices can be edited.`,
      400
    );
  }

  if (data.customer) {
    const customerExists = await Customer.exists({
      _id: data.customer,
      user: new mongoose.Types.ObjectId(userId),
    });
    if (!customerExists) throw new AppError('Customer not found', 404);
    invoice.customer = new mongoose.Types.ObjectId(data.customer);
  }

  if (data.invoiceNumber && data.invoiceNumber !== invoice.invoiceNumber) {
    const existing = await Invoice.exists({
      user: new mongoose.Types.ObjectId(userId),
      invoiceNumber: data.invoiceNumber,
      _id: { $ne: invoiceId },
    });
    if (existing) {
      throw new AppError(`Invoice number "${data.invoiceNumber}" is already in use`, 400);
    }
    invoice.invoiceNumber = data.invoiceNumber;
  }

  if (data.issueDate) invoice.issueDate = data.issueDate;
  if (data.dueDate) invoice.dueDate = data.dueDate;
  if (data.notes !== undefined) invoice.notes = data.notes;

  // Re-calculate financial totals safely if items or discount are updated
  if (data.items || data.discount !== undefined) {
    const itemsToCalculate = data.items || invoice.items;
    const discountToCalculate =
      data.discount !== undefined ? data.discount : invoice.discount;

    const calc = calculateInvoiceTotals(itemsToCalculate as any, discountToCalculate);

    if (data.items) {
      invoice.items = data.items.map((item, index) => ({
        product: item.product ? new mongoose.Types.ObjectId(item.product) : undefined,
        description: item.description,
        quantity: calc.processedItems[index].quantity,
        unitPrice: calc.processedItems[index].unitPrice,
        taxRate: calc.processedItems[index].taxRate,
        total: calc.processedItems[index].total,
      })) as any;
    }

    invoice.subtotal = calc.subtotal;
    invoice.discount = calc.discount;
    invoice.taxTotal = calc.taxTotal;
    invoice.grandTotal = calc.grandTotal;
    invoice.amountDue = Math.max(0, round2(calc.grandTotal - invoice.amountPaid));
  }

  if (data.status) {
    invoice.status = data.status as InvoiceStatusEnum;
    if (invoice.status === InvoiceStatusEnum.PAID) {
      invoice.amountPaid = invoice.grandTotal;
      invoice.amountDue = 0;
    }
  }

  await invoice.save();
  return invoice;
};

export const deleteInvoice = async (
  userId: string,
  invoiceId: string
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new AppError('Invalid invoice ID', 400);
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.status !== InvoiceStatusEnum.DRAFT) {
    throw new AppError(
      `Cannot delete invoice in "${invoice.status}" status. Only draft invoices can be deleted.`,
      400
    );
  }

  await Invoice.deleteOne({ _id: invoiceId, user: new mongoose.Types.ObjectId(userId) });
};

export const duplicateInvoice = async (
  userId: string,
  invoiceId: string
): Promise<IInvoice> => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new AppError('Invalid invoice ID', 400);
  }

  const original = await Invoice.findOne({
    _id: invoiceId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!original) {
    throw new AppError('Invoice not found', 404);
  }

  const newInvoiceNumber = await generateNextInvoiceNumber(userId);

  const duplicated = await Invoice.create({
    user: new mongoose.Types.ObjectId(userId),
    customer: original.customer,
    invoiceNumber: newInvoiceNumber,
    status: InvoiceStatusEnum.DRAFT,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    items: original.items.map((i) => ({
      product: i.product,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      taxRate: i.taxRate,
      total: i.total,
    })),
    subtotal: original.subtotal,
    discount: original.discount,
    taxTotal: original.taxTotal,
    grandTotal: original.grandTotal,
    amountPaid: 0,
    amountDue: original.grandTotal,
    notes: original.notes,
  });

  return duplicated;
};

export const markInvoicePaid = async (
  userId: string,
  invoiceId: string
): Promise<IInvoice> => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new AppError('Invalid invoice ID', 400);
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  invoice.status = InvoiceStatusEnum.PAID;
  invoice.amountPaid = invoice.grandTotal;
  invoice.amountDue = 0;

  await invoice.save();
  return invoice;
};

export const getInvoiceForPdf = async (
  userId: string,
  invoiceId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new AppError('Invalid invoice ID', 400);
  }

  const [invoice, business] = await Promise.all([
    Invoice.findOne({
      _id: invoiceId,
      user: new mongoose.Types.ObjectId(userId),
    }).populate('customer'),
    BusinessProfile.findOne({ user: new mongoose.Types.ObjectId(userId) }),
  ]);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (!invoice.customer) {
    throw new AppError('Customer associated with this invoice was not found', 404);
  }

  return {
    invoice,
    customer: invoice.customer as any,
    business: business || {
      businessName: 'My Business',
      defaultCurrency: 'BDT',
      invoicePrefix: 'INV-',
    } as any,
  };
};

