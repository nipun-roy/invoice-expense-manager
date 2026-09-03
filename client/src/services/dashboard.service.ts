import api from './api';
import { ApiResponse } from './auth.service';
import { InvoiceData } from './invoice.service';
import { ExpenseData } from './expense.service';

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalOutstanding: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalInvoices: number;
}

export interface MonthlyOverviewPoint {
  year: number;
  month: number;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  monthlyOverview: MonthlyOverviewPoint[];
  recentInvoices: InvoiceData[];
  recentExpenses: ExpenseData[];
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardData> {
    const res = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return res.data.data;
  },
};

