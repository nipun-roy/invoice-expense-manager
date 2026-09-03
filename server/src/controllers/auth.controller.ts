import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, getUserProfile } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, token } = await registerUser(req.body);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, token } = await loginUser(req.body);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const userProfile = await getUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};
