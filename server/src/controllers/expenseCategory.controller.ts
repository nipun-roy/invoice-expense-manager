import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '../services/expenseCategory.service.js';
import { AppError } from '../utils/AppError.js';

export const list = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const categories = await getExpenseCategories(userId);
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const category = await createExpenseCategory(userId, req.body.name);
    res.status(201).json({
      success: true,
      message: 'Expense category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const category = await updateExpenseCategory(
      userId,
      req.params.id,
      req.body.name
    );
    res.status(200).json({
      success: true,
      message: 'Expense category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    await deleteExpenseCategory(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Expense category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

