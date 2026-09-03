import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.token;

  if (!token) {
    return next(new AppError('Unauthorized: Missing authentication token', 401));
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return next(new AppError('Unauthorized: Invalid or expired token', 401));
  }
};
