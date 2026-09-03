import { User } from '../models/User.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  token: string;
}

export const registerUser = async (data: RegisterInput): Promise<AuthResponse> => {
  const normalizedEmail = data.email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await User.create({
    name: data.name,
    email: normalizedEmail,
    passwordHash,
  });

  await BusinessProfile.create({
    user: user._id,
    businessName: `${data.name}'s Business`,
    email: normalizedEmail,
    invoicePrefix: 'INV-',
    defaultCurrency: 'BDT',
  });

  const token = generateToken(user._id.toString());

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

export const loginUser = async (data: LoginInput): Promise<AuthResponse> => {
  const normalizedEmail = data.email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user._id.toString());

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const businessProfile = await BusinessProfile.findOne({ user: userId });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    businessProfile: businessProfile || null,
  };
};
