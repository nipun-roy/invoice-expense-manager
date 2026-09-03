import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../services/expense.service.js';
import { AppError } from '../utils/AppError.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const expense = await createExpense(userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

export const list = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const result = await getExpenses(userId, req.query as any);
    res.status(200).json({
      success: true,
      data: result.expenses,
      totalAmount: result.totalAmount,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const expense = await getExpenseById(userId, req.params.id);
    res.status(200).json({
      success: true,
      data: expense,
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

    const expense = await updateExpense(userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
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

    await deleteExpense(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

