import api from './api';
import { ApiResponse } from './auth.service';

export interface BusinessProfileData {
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

export const businessProfileService = {
  async getProfile(): Promise<BusinessProfileData> {
    const res = await api.get<ApiResponse<BusinessProfileData>>('/business-profile');
    return res.data.data;
  },

  async updateProfile(data: Partial<BusinessProfileData>): Promise<BusinessProfileData> {
    const res = await api.put<ApiResponse<BusinessProfileData>>('/business-profile', data);
    return res.data.data;
  },
};

