import api from './api';
import { ApiResponse } from './auth.service';

export interface IncomeReportData {
  dateRange: any;
  totalIncome: number;
  totalBilled: number;
  invoiceCount: number;
  monthlyBreakdown: Array<{
    year: number;
    month: number;
    label: string;
    collected: number;
    billed: number;
    count: number;
  }>;
}

export interface ExpenseReportData {
  dateRange: any;
  totalExpenses: number;
  expenseCount: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  monthlyBreakdown: Array<{
    year: number;
    month: number;
    label: string;
    total: number;
    count: number;
  }>;
}

export interface ProfitSummaryData {
  dateRange: any;
  revenue: number;
  expenses: number;
  netProfit: number;
  marginPercentage: number;
}

export interface InvoiceReportData {
  dateRange: any;
  totalInvoices: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  statusBreakdown: {
    draft: { count: number; totalAmount: number };
    sent: { count: number; totalAmount: number };
    paid: { count: number; totalAmount: number };
    overdue: { count: number; totalAmount: number };
    cancelled: { count: number; totalAmount: number };
  };
}

export const reportService = {
  async getIncomeReport(params?: { dateFilter?: string; startDate?: string; endDate?: string }): Promise<IncomeReportData> {
    const res = await api.get<ApiResponse<IncomeReportData>>('/reports/income', { params });
    return res.data.data;
  },

  async getExpenseReport(params?: { dateFilter?: string; startDate?: string; endDate?: string }): Promise<ExpenseReportData> {
    const res = await api.get<ApiResponse<ExpenseReportData>>('/reports/expenses', { params });
    return res.data.data;
  },

  async getProfitSummary(params?: { dateFilter?: string; startDate?: string; endDate?: string }): Promise<ProfitSummaryData> {
    const res = await api.get<ApiResponse<ProfitSummaryData>>('/reports/profit', { params });
    return res.data.data;
  },

  async getInvoiceReport(params?: { dateFilter?: string; startDate?: string; endDate?: string }): Promise<InvoiceReportData> {
    const res = await api.get<ApiResponse<InvoiceReportData>>('/reports/invoices', { params });
    return res.data.data;
  },
};

