import api from './api';
import { ApiResponse } from './auth.service';
import { CustomerData, PaginationMeta } from './customer.service';

export interface InvoiceItemData {
  _id?: string;
  product?: string | { _id: string; name: string; price: number; unit: string };
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total?: number;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceData {
  _id: string;
  user: string;
  customer: string | CustomerData;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: InvoiceItemData[];
  subtotal: number;
  discount: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesResponse {
  success: boolean;
  data: InvoiceData[];
  pagination: PaginationMeta;
}

export interface CreateInvoicePayload {
  customer: string;
  invoiceNumber?: string;
  status?: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  items: Array<{
    product?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  discount?: number;
  notes?: string;
}

export const invoiceService = {
  async getInvoices(params?: {
    status?: string;
    customer?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ invoices: InvoiceData[]; pagination: PaginationMeta }> {
    const res = await api.get<InvoicesResponse>('/invoices', { params });
    return { invoices: res.data.data, pagination: res.data.pagination };
  },

  async getInvoice(id: string): Promise<InvoiceData> {
    const res = await api.get<ApiResponse<InvoiceData>>(`/invoices/${id}`);
    return res.data.data;
  },

  async createInvoice(data: CreateInvoicePayload): Promise<InvoiceData> {
    const res = await api.post<ApiResponse<InvoiceData>>('/invoices', data);
    return res.data.data;
  },

  async updateInvoice(id: string, data: Partial<CreateInvoicePayload>): Promise<InvoiceData> {
    const res = await api.put<ApiResponse<InvoiceData>>(`/invoices/${id}`, data);
    return res.data.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },

  async duplicateInvoice(id: string): Promise<InvoiceData> {
    const res = await api.post<ApiResponse<InvoiceData>>(`/invoices/${id}/duplicate`);
    return res.data.data;
  },

  async markPaid(id: string): Promise<InvoiceData> {
    const res = await api.patch<ApiResponse<InvoiceData>>(`/invoices/${id}/mark-paid`);
    return res.data.data;
  },

  async downloadPdf(id: string, invoiceNumber: string): Promise<void> {
    const res = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

