import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  getBusinessProfile,
  updateBusinessProfile,
} from '../services/businessProfile.service.js';
import { AppError } from '../utils/AppError.js';

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }
    const profile = await getBusinessProfile(userId);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }
    const profile = await updateBusinessProfile(userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Business profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

