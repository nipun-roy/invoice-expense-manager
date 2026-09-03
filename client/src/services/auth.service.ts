import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface BusinessProfile {
  _id?: string;
  user?: string;
  businessName: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxVatNumber?: string;
  invoicePrefix: string;
  defaultCurrency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  businessProfile: BusinessProfile | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const authService = {
  async register(data: RegisterData): Promise<User> {
    const res = await api.post<ApiResponse<User>>('/auth/register', data);
    return res.data.data;
  },

  async login(credentials: LoginCredentials): Promise<User> {
    const res = await api.post<ApiResponse<User>>('/auth/login', credentials);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<UserProfile> {
    const res = await api.get<ApiResponse<UserProfile>>('/auth/me');
    return res.data.data;
  },
};

