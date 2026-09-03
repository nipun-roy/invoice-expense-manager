import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  getIncomeReport,
  getExpenseReport,
  getProfitSummary,
  getInvoiceReport,
} from '../services/report.service.js';
import { AppError } from '../utils/AppError.js';

export const income = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const { dateFilter, startDate, endDate } = req.query as Record<string, string>;
    const data = await getIncomeReport(userId, dateFilter, startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const expenses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const { dateFilter, startDate, endDate } = req.query as Record<string, string>;
    const data = await getExpenseReport(userId, dateFilter, startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const profit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const { dateFilter, startDate, endDate } = req.query as Record<string, string>;
    const data = await getProfitSummary(userId, dateFilter, startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const invoices = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const { dateFilter, startDate, endDate } = req.query as Record<string, string>;
    const data = await getInvoiceReport(userId, dateFilter, startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

