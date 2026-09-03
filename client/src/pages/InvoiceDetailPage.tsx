import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  invoiceService,
  InvoiceData,
  InvoiceStatus,
} from '../services/invoice.service';
import { CustomerData } from '../services/customer.service';
import { paymentService } from '../services/payment.service';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Copy,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  X,
} from 'lucide-react';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const business = user?.businessProfile;
  const currency = business?.defaultCurrency || 'BDT';

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Payment Recording State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const openPaymentModal = () => {
    if (!invoice) return;
    setPaymentAmount(invoice.amountDue);
    setPaymentMethod('BANK_TRANSFER');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > invoice.amountDue) {
      setPaymentError(`Payment amount cannot exceed remaining balance (${currency} ${invoice.amountDue.toFixed(2)})`);
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError(null);
    try {
      const res = await paymentService.recordPayment({
        invoice: invoice._id,
        amount: paymentAmount,
        date: paymentDate,
        method: paymentMethod,
        notes: paymentNotes,
      });
      setInvoice(res.invoice);
      setIsPaymentModalOpen(false);
      setSuccessMsg(`Payment of ${currency} ${paymentAmount.toFixed(2)} recorded successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      setPaymentError(msg);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const fetchInvoice = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await invoiceService.getInvoice(id);
      setInvoice(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load invoice';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await invoiceService.downloadPdf(invoice._id, invoice.invoiceNumber);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download PDF';
      setError(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const updated = await invoiceService.markPaid(invoice._id);
      setInvoice(updated);
      setSuccessMsg(`Invoice marked as PAID!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const duplicated = await invoiceService.duplicateInvoice(invoice._id);
      navigate(`/invoices/${duplicated._id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to duplicate invoice';
      setError(msg);
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!window.confirm('Are you sure you want to delete this draft invoice?')) return;
    setActionLoading(true);
    try {
      await invoiceService.deleteInvoice(invoice._id);
      navigate('/invoices');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(msg);
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            PAID IN FULL
          </span>
        );
      case 'SENT':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            SENT TO CLIENT
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            DRAFT
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            OVERDUE
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Loading invoice record...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Unable to load invoice</h2>
        <p className="text-xs text-gray-500">{error || 'Invoice not found.'}</p>
        <Link
          to="/invoices"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
      </div>
    );
  }

  const customer = invoice.customer as CustomerData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                #{invoice.invoiceNumber}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Created on {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </button>

          {/* Record Payment */}
          {invoice.amountDue > 0 && invoice.status !== 'CANCELLED' && (
            <button
              onClick={openPaymentModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              Record Payment
            </button>
          )}

          {/* Quick Mark Paid */}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={handleMarkPaid}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Paid
            </button>
          )}

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 shadow-sm"
            title="Duplicate as new draft"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>

          {/* Edit (Draft only) */}
          {invoice.status === 'DRAFT' && (
            <Link
              to={`/invoices/${invoice._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Draft
            </Link>
          )}

          {/* Delete (Draft only) */}
          {invoice.status === 'DRAFT' && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-60"
              title="Delete draft invoice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Invoice Document Paper Sheet */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-slate-100 p-8 sm:p-12 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-sky-600 mb-2">
              <Building2 className="w-6 h-6" />
              <span className="font-bold text-xl tracking-tight text-gray-900">
                {business?.businessName || 'Business Name'}
              </span>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">
              {business?.email && <div>Email: {business.email}</div>}
              {business?.phone && <div>Phone: {business.phone}</div>}
              {business?.address && <div>{business.address}</div>}
              {business?.taxVatNumber && <div>Tax ID / VAT: {business.taxVatNumber}</div>}
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">INVOICE</h2>
            <p className="font-mono text-xs font-semibold text-sky-600">
              #{invoice.invoiceNumber}
            </p>
            <div className="text-xs text-gray-500 pt-2 space-y-1">
              <div className="flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Block */}
        <div className="bg-gray-50/75 rounded-xl p-5 border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Billed To
          </span>
          <h3 className="font-semibold text-gray-900 text-sm">{customer?.name}</h3>
          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
            {customer?.email && <div>{customer.email}</div>}
            {customer?.phone && <div>{customer.phone}</div>}
            {customer?.address && <div>{customer.address}</div>}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-2">Description</th>
                <th className="py-3 px-2 text-right">Qty</th>
                <th className="py-3 px-2 text-right">Unit Price</th>
                <th className="py-3 px-2 text-right">Tax</th>
                <th className="py-3 px-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-2 font-medium text-gray-900">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-2 text-right text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-2 text-right text-gray-600 font-mono">
                    {currency} {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-2 text-right text-gray-500">
                    {item.taxRate || 0}%
                  </td>
                  <td className="py-3.5 px-2 text-right font-semibold text-gray-800 font-mono">
                    {currency} {(item.total || item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-6">
          <div className="max-w-xs space-y-2">
            {invoice.notes && (
              <div>
                <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                  Payment Notes & Terms
                </span>
                <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {invoice.notes}
                </p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{currency} {invoice.subtotal.toFixed(2)}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span className="font-mono font-medium">-{currency} {invoice.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Tax Total:</span>
              <span className="font-mono font-medium">{currency} {invoice.taxTotal.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm text-gray-900">
              <span>Grand Total:</span>
              <span className="font-mono text-sky-700">{currency} {invoice.grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Amount Paid:</span>
              <span className="font-mono text-emerald-600 font-medium">
                {currency} {invoice.amountPaid.toFixed(2)}
              </span>
            </div>

            <div className="pt-1 border-t border-gray-100 flex justify-between font-bold text-xs text-gray-900">
              <span>Balance Due:</span>
              <span className="font-mono text-rose-600">
                {currency} {invoice.amountDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                Record Payment for #{invoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-sky-800 font-medium">Outstanding Balance Due:</span>
                <span className="font-mono font-bold text-sky-900 text-sm">
                  {currency} {invoice.amountDue.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Amount ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={invoice.amountDue}
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Supports full payment or partial installment payments.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="STRIPE">Stripe</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Reference / Memo
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Wire confirmation #98765"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {paymentSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailPage;

