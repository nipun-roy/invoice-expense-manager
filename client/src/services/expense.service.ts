import api from './api';
import { ApiResponse } from './auth.service';
import { PaginationMeta } from './customer.service';

export interface ExpenseCategoryData {
  _id: string;
  name: string;
}

export interface ExpenseData {
  _id: string;
  user: string;
  category: ExpenseCategoryData | string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYPAL' | 'STRIPE' | 'OTHER';
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesResponse {
  success: boolean;
  data: ExpenseData[];
  totalAmount: number;
  pagination: PaginationMeta;
}

export interface CreateExpensePayload {
  title: string;
  category: string;
  amount: number;
  date?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
}

export const expenseService = {
  async getExpenses(params?: {
    search?: string;
    category?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ expenses: ExpenseData[]; totalAmount: number; pagination: PaginationMeta }> {
    const res = await api.get<ExpensesResponse>('/expenses', { params });
    return {
      expenses: res.data.data,
      totalAmount: res.data.totalAmount,
      pagination: res.data.pagination,
    };
  },

  async getExpense(id: string): Promise<ExpenseData> {
    const res = await api.get<ApiResponse<ExpenseData>>(`/expenses/${id}`);
    return res.data.data;
  },

  async createExpense(data: CreateExpensePayload): Promise<ExpenseData> {
    const res = await api.post<ApiResponse<ExpenseData>>('/expenses', data);
    return res.data.data;
  },

  async updateExpense(id: string, data: Partial<CreateExpensePayload>): Promise<ExpenseData> {
    const res = await api.put<ApiResponse<ExpenseData>>(`/expenses/${id}`, data);
    return res.data.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  // Category helpers
  async getCategories(): Promise<ExpenseCategoryData[]> {
    const res = await api.get<ApiResponse<ExpenseCategoryData[]>>('/expense-categories');
    return res.data.data;
  },

  async createCategory(name: string): Promise<ExpenseCategoryData> {
    const res = await api.post<ApiResponse<ExpenseCategoryData>>('/expense-categories', { name });
    return res.data.data;
  },

  async updateCategory(id: string, name: string): Promise<ExpenseCategoryData> {
    const res = await api.put<ApiResponse<ExpenseCategoryData>>(`/expense-categories/${id}`, { name });
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/expense-categories/${id}`);
  },
};

