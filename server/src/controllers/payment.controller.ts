import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  recordPayment,
  getPayments,
  getPaymentById,
} from '../services/payment.service.js';
import { AppError } from '../utils/AppError.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const result = await recordPayment(userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: result.payment,
      invoice: result.invoice,
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

    const result = await getPayments(userId, req.query as any);
    res.status(200).json({
      success: true,
      data: result.payments,
      totalCollected: result.totalCollected,
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

    const payment = await getPaymentById(userId, req.params.id);
    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

