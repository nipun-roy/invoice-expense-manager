import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getDashboardMetrics } from '../services/dashboard.service.js';
import { AppError } from '../utils/AppError.js';

export const getMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const data = await getDashboardMetrics(userId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

