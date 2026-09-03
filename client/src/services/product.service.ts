import api from './api';
import { ApiResponse } from './auth.service';
import { PaginationMeta } from './customer.service';

export interface ProductData {
  _id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  taxRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  data: ProductData[];
  pagination: PaginationMeta;
}

export const productService = {
  async getProducts(params?: { search?: string; isActive?: string; page?: number; limit?: number }): Promise<{ products: ProductData[]; pagination: PaginationMeta }> {
    const res = await api.get<ProductsResponse>('/products', { params });
    return { products: res.data.data, pagination: res.data.pagination };
  },

  async getProduct(id: string): Promise<ProductData> {
    const res = await api.get<ApiResponse<ProductData>>(`/products/${id}`);
    return res.data.data;
  },

  async createProduct(data: Omit<ProductData, '_id' | 'createdAt' | 'updatedAt'>): Promise<ProductData> {
    const res = await api.post<ApiResponse<ProductData>>('/products', data);
    return res.data.data;
  },

  async updateProduct(id: string, data: Partial<ProductData>): Promise<ProductData> {
    const res = await api.put<ApiResponse<ProductData>>(`/products/${id}`, data);
    return res.data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};

