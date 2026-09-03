import { Customer, ICustomer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
} from '../validators/customer.validator.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export const createCustomer = async (
  userId: string,
  data: CreateCustomerInput
): Promise<ICustomer> => {
  const customer = await Customer.create({
    user: new mongoose.Types.ObjectId(userId),
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    notes: data.notes || '',
  });

  return customer;
};

export const getCustomers = async (
  userId: string,
  query: CustomerQueryInput
) => {
  const filter: Record<string, any> = { user: new mongoose.Types.ObjectId(userId) };

  if (query.search && query.search.trim() !== '') {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Customer.countDocuments(filter),
  ]);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCustomerById = async (
  userId: string,
  customerId: string
): Promise<ICustomer> => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new AppError('Invalid customer ID', 400);
  }

  const customer = await Customer.findOne({
    _id: customerId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  return customer;
};

export const updateCustomer = async (
  userId: string,
  customerId: string,
  data: UpdateCustomerInput
): Promise<ICustomer> => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new AppError('Invalid customer ID', 400);
  }

  const customer = await Customer.findOneAndUpdate(
    {
      _id: customerId,
      user: new mongoose.Types.ObjectId(userId),
    },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  return customer;
};

export const deleteCustomer = async (
  userId: string,
  customerId: string
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new AppError('Invalid customer ID', 400);
  }

  // Check referential integrity: do invoices exist for this customer?
  const hasInvoices = await Invoice.exists({
    customer: customerId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (hasInvoices) {
    throw new AppError(
      'Cannot delete customer with associated invoices. Delete the invoices first.',
      400
    );
  }

  const deleted = await Customer.findOneAndDelete({
    _id: customerId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!deleted) {
    throw new AppError('Customer not found', 404);
  }
};

