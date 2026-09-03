import { Expense, IExpense } from '../models/Expense.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseQueryInput,
} from '../validators/expense.validator.js';
import { parseDateRange } from '../utils/dateRange.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const createExpense = async (
  userId: string,
  data: CreateExpenseInput
): Promise<IExpense> => {
  // Validate category ownership
  const categoryExists = await ExpenseCategory.exists({
    _id: data.category,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!categoryExists) {
    throw new AppError('Expense category not found or access denied', 404);
  }

  const expense = await Expense.create({
    user: new mongoose.Types.ObjectId(userId),
    category: new mongoose.Types.ObjectId(data.category),
    title: data.title,
    amount: round2(data.amount),
    date: data.date,
    paymentMethod: data.paymentMethod,
    receiptUrl: data.receiptUrl || '',
    notes: data.notes || '',
  });

  return expense;
};

export const getExpenses = async (
  userId: string,
  query: ExpenseQueryInput
) => {
  const filter: Record<string, any> = {
    user: new mongoose.Types.ObjectId(userId),
  };

  // Category filter
  if (query.category && mongoose.Types.ObjectId.isValid(query.category)) {
    filter.category = new mongoose.Types.ObjectId(query.category);
  }

  // Date range filter
  const dateRange = parseDateRange(
    query.dateFilter,
    query.startDate,
    query.endDate
  );
  if (dateRange) {
    filter.date = { $gte: dateRange.startDate, $lte: dateRange.endDate };
  }

  // Search filter
  if (query.search && query.search.trim() !== '') {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ title: searchRegex }, { notes: searchRegex }];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [expenses, total, summaryAgg] = await Promise.all([
    Expense.find(filter)
      .populate('category', 'name')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(filter),
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]),
  ]);

  const totalExpenseAmount =
    summaryAgg.length > 0 ? round2(summaryAgg[0].totalAmount) : 0;

  return {
    expenses,
    totalAmount: totalExpenseAmount,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getExpenseById = async (
  userId: string,
  expenseId: string
): Promise<IExpense> => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new AppError('Invalid expense ID', 400);
  }

  const expense = await Expense.findOne({
    _id: expenseId,
    user: new mongoose.Types.ObjectId(userId),
  }).populate('category', 'name');

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return expense;
};

export const updateExpense = async (
  userId: string,
  expenseId: string,
  data: UpdateExpenseInput
): Promise<IExpense> => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new AppError('Invalid expense ID', 400);
  }

  if (data.category) {
    const categoryExists = await ExpenseCategory.exists({
      _id: data.category,
      user: new mongoose.Types.ObjectId(userId),
    });
    if (!categoryExists) {
      throw new AppError('Expense category not found', 404);
    }
  }

  const updateData: Record<string, any> = { ...data };
  if (data.amount !== undefined) {
    updateData.amount = round2(data.amount);
  }

  const expense = await Expense.findOneAndUpdate(
    {
      _id: expenseId,
      user: new mongoose.Types.ObjectId(userId),
    },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('category', 'name');

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return expense;
};

export const deleteExpense = async (
  userId: string,
  expenseId: string
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new AppError('Invalid expense ID', 400);
  }

  const deleted = await Expense.findOneAndDelete({
    _id: expenseId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!deleted) {
    throw new AppError('Expense not found', 404);
  }
};

