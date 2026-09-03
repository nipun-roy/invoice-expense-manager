import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  invoiceService,
  InvoiceData,
  InvoiceStatus,
} from '../services/invoice.service';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  Copy,
  CheckCircle,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.businessProfile?.defaultCurrency || 'BDT';

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Action states
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(
    async (pageToLoad = 1, searchQuery = search, status = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const data = await invoiceService.getInvoices({
          page: pageToLoad,
          limit: 10,
          search: searchQuery.trim() || undefined,
          status: status === 'ALL' ? undefined : status,
        });
        setInvoices(data.invoices);
        setPagination(data.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load invoices';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    fetchInvoices(1, search, statusFilter);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices(1, search, statusFilter);
  };

  const handleMarkPaid = async (invoice: InvoiceData) => {
    setActionLoadingId(invoice._id);
    try {
      await invoiceService.markPaid(invoice._id);
      setSuccessMsg(`Invoice #${invoice.invoiceNumber} marked as Paid`);
      fetchInvoices(pagination.page, search, statusFilter);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (invoice: InvoiceData) => {
    setActionLoadingId(invoice._id);
    try {
      const dup = await invoiceService.duplicateInvoice(invoice._id);
      setSuccessMsg(`Duplicated as new draft #${dup.invoiceNumber}`);
      fetchInvoices(1, search, statusFilter);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to duplicate invoice';
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteDraft = async () => {
    if (!deletingId) return;
    setActionLoadingId(deletingId);
    try {
      await invoiceService.deleteInvoice(deletingId);
      setSuccessMsg('Draft invoice deleted successfully');
      setDeletingId(null);
      fetchInvoices(pagination.page, search, statusFilter);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(msg);
      setDeletingId(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadPdf = async (invoice: InvoiceData) => {
    setDownloadingId(invoice._id);
    try {
      await invoiceService.downloadPdf(invoice._id, invoice.invoiceNumber);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download PDF';
      setError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const { t } = useLanguage();

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {t('statusPaid')}
          </span>
        );
      case 'SENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            {t('statusSent')}
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {t('statusDraft')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {t('statusOverdue')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {t('statusCancelled')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('invoicesTitle')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('invoicesSubtitle')}
          </p>
        </div>

        <Link
          to="/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('createInvoice')}
        </Link>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filters & Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const).map((st) => {
            const labelMap: Record<string, string> = {
              ALL: t('all'),
              DRAFT: t('statusDraft'),
              SENT: t('statusSent'),
              PAID: t('statusPaid'),
              OVERDUE: t('statusOverdue'),
              CANCELLED: t('statusCancelled'),
            };

            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  fetchInvoices(1, search, st);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {labelMap[st] || st}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            {t('search').replace('...', '')}
          </button>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
            <p className="text-xs text-gray-500 font-medium">{t('loading')}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{t('noInvoicesFound')}</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL'
                ? 'ফিল্টারের সাথে কোনো ইনভয়েস মিলেনি।'
                : 'আপনার প্রথম ক্লায়েন্ট ইনভয়েস তৈরি করে শুরু করুন।'}
            </p>
            <Link
              to="/invoices/new"
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('createInvoice')}
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">{t('invoiceNumber')}</th>
                    <th className="py-3.5 px-4">{t('customer')}</th>
                    <th className="py-3.5 px-4">{t('actions')}</th>
                    <th className="py-3.5 px-4">{t('issueDate')}</th>
                    <th className="py-3.5 px-4">{t('dueDate')}</th>
                    <th className="py-3.5 px-4 text-right">{t('grandTotal')}</th>
                    <th className="py-3.5 px-4 text-right">{t('balanceDue')}</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => {
                    const custName =
                      typeof inv.customer === 'object' && inv.customer !== null
                        ? inv.customer.name
                        : 'Customer';

                    return (
                      <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <Link
                            to={`/invoices/${inv._id}`}
                            className="font-mono font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                          >
                            #{inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {custName}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(inv.status)}</td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                          {currency} {inv.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium">
                          {inv.amountDue > 0 ? (
                            <span className="text-amber-600">
                              {currency} {inv.amountDue.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-emerald-600">Paid in full</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View */}
                            <Link
                              to={`/invoices/${inv._id}`}
                              className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="View Invoice Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Download PDF */}
                            <button
                              onClick={() => handleDownloadPdf(inv)}
                              disabled={downloadingId === inv._id}
                              className="p-1.5 text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Download PDF"
                            >
                              {downloadingId === inv._id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>

                            {/* Edit (Drafts only) */}
                            {inv.status === 'DRAFT' && (
                              <Link
                                to={`/invoices/${inv._id}/edit`}
                                className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                title="Edit Draft"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                            )}

                            {/* Mark Paid (if not already paid) */}
                            {inv.status !== 'PAID' && (
                              <button
                                onClick={() => handleMarkPaid(inv)}
                                disabled={actionLoadingId === inv._id}
                                className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(inv)}
                              disabled={actionLoadingId === inv._id}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Duplicate as New Draft"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Delete (Draft only) */}
                            {inv.status === 'DRAFT' && (
                              <button
                                onClick={() => setDeletingId(inv._id)}
                                className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Draft"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <div>
                  Showing page <span className="font-semibold text-gray-800">{pagination.page}</span>{' '}
                  of <span className="font-semibold text-gray-800">{pagination.totalPages}</span>{' '}
                  ({pagination.total} total invoices)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchInvoices(pagination.page - 1, search, statusFilter)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchInvoices(pagination.page + 1, search, statusFilter)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Draft Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Delete Draft Invoice</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this draft invoice? This action cannot be reversed.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={actionLoadingId === deletingId}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {actionLoadingId === deletingId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;

