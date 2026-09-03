import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../services/customer.service.js';
import { AppError } from '../utils/AppError.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const customer = await createCustomer(userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
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

    const result = await getCustomers(userId, req.query as any);
    res.status(200).json({
      success: true,
      data: result.customers,
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

    const customer = await getCustomerById(userId, req.params.id);
    res.status(200).json({
      success: true,
      data: customer,
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

    const customer = await updateCustomer(userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
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

    await deleteCustomer(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

