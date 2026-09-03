import api from './api';
import { ApiResponse } from './auth.service';

export interface CustomerData {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomersResponse {
  success: boolean;
  data: CustomerData[];
  pagination: PaginationMeta;
}

export const customerService = {
  async getCustomers(params?: { search?: string; page?: number; limit?: number }): Promise<{ customers: CustomerData[]; pagination: PaginationMeta }> {
    const res = await api.get<CustomersResponse>('/customers', { params });
    return { customers: res.data.data, pagination: res.data.pagination };
  },

  async getCustomer(id: string): Promise<CustomerData> {
    const res = await api.get<ApiResponse<CustomerData>>(`/customers/${id}`);
    return res.data.data;
  },

  async createCustomer(data: Omit<CustomerData, '_id' | 'createdAt' | 'updatedAt'>): Promise<CustomerData> {
    const res = await api.post<ApiResponse<CustomerData>>('/customers', data);
    return res.data.data;
  },

  async updateCustomer(id: string, data: Partial<CustomerData>): Promise<CustomerData> {
    const res = await api.put<ApiResponse<CustomerData>>(`/customers/${id}`, data);
    return res.data.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};

