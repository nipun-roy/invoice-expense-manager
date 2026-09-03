import api from './api';
import { ApiResponse } from './auth.service';
import { InvoiceData } from './invoice.service';

export interface PaymentData {
  _id: string;
  user: string;
  invoice: string | { _id: string; invoiceNumber: string; grandTotal: number; status: string };
  amount: number;
  date: string;
  method: string;
  notes?: string;
  createdAt: string;
}

export interface RecordPaymentPayload {
  invoice: string;
  amount: number;
  date?: string;
  method?: string;
  notes?: string;
}

export const paymentService = {
  async recordPayment(data: RecordPaymentPayload): Promise<{ payment: PaymentData; invoice: InvoiceData }> {
    const res = await api.post<ApiResponse<PaymentData> & { invoice: InvoiceData }>('/payments', data);
    return {
      payment: res.data.data,
      invoice: res.data.invoice,
    };
  },

  async getPayments(params?: {
    invoice?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ payments: PaymentData[]; totalCollected: number }> {
    const res = await api.get<{ success: boolean; data: PaymentData[]; totalCollected: number }>('/payments', {
      params,
    });
    return {
      payments: res.data.data,
      totalCollected: res.data.totalCollected,
    };
  },
};

