import { ExpenseCategory, IExpenseCategory } from '../models/ExpenseCategory.js';
import { Expense } from '../models/Expense.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

const DEFAULT_CATEGORIES = [
  'Office Supplies',
  'Software & Subscriptions',
  'Travel & Meals',
  'Marketing & Advertising',
  'Utilities & Internet',
  'Salaries & Contractors',
  'Legal & Professional Services',
  'Other Expenses',
];

export const getExpenseCategories = async (
  userId: string
): Promise<IExpenseCategory[]> => {
  let categories = await ExpenseCategory.find({
    user: new mongoose.Types.ObjectId(userId),
  }).sort({ name: 1 });

  // If new user has no categories, seed sensible defaults
  if (categories.length === 0) {
    const defaultDocs = DEFAULT_CATEGORIES.map((name) => ({
      user: new mongoose.Types.ObjectId(userId),
      name,
    }));
    await ExpenseCategory.insertMany(defaultDocs);
    categories = await ExpenseCategory.find({
      user: new mongoose.Types.ObjectId(userId),
    }).sort({ name: 1 });
  }

  return categories;
};

export const createExpenseCategory = async (
  userId: string,
  name: string
): Promise<IExpenseCategory> => {
  const trimmed = name.trim();
  const existing = await ExpenseCategory.findOne({
    user: new mongoose.Types.ObjectId(userId),
    name: new RegExp(`^${trimmed}$`, 'i'),
  });

  if (existing) {
    throw new AppError(`Category "${trimmed}" already exists`, 400);
  }

  const category = await ExpenseCategory.create({
    user: new mongoose.Types.ObjectId(userId),
    name: trimmed,
  });

  return category;
};

export const updateExpenseCategory = async (
  userId: string,
  categoryId: string,
  name: string
): Promise<IExpenseCategory> => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID', 400);
  }

  const trimmed = name.trim();
  const existing = await ExpenseCategory.findOne({
    user: new mongoose.Types.ObjectId(userId),
    name: new RegExp(`^${trimmed}$`, 'i'),
    _id: { $ne: categoryId },
  });

  if (existing) {
    throw new AppError(`Category "${trimmed}" already exists`, 400);
  }

  const category = await ExpenseCategory.findOneAndUpdate(
    {
      _id: categoryId,
      user: new mongoose.Types.ObjectId(userId),
    },
    { $set: { name: trimmed } },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
};

export const deleteExpenseCategory = async (
  userId: string,
  categoryId: string
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID', 400);
  }

  // Check if any expenses are assigned to this category
  const inUse = await Expense.exists({
    user: new mongoose.Types.ObjectId(userId),
    category: new mongoose.Types.ObjectId(categoryId),
  });

  if (inUse) {
    throw new AppError(
      'Cannot delete category currently in use by expenses. Please reassign or delete those expenses first.',
      400
    );
  }

  const deleted = await ExpenseCategory.findOneAndDelete({
    _id: categoryId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!deleted) {
    throw new AppError('Category not found', 404);
  }
};

