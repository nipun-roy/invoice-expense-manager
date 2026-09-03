import React, { useState, useEffect, useCallback } from 'react';
import {
  customerService,
  CustomerData,
  PaginationMeta,
} from '../services/customer.service';
import { useLanguage } from '../context/LanguageContext';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchCustomers = useCallback(async (pageToLoad = 1, searchQuery = search) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers({
        page: pageToLoad,
        limit: 10,
        search: searchQuery.trim() || undefined,
      });
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load customers';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers(1, search);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1, search);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Customer name is required');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer._id, formData);
        setSuccessMsg('Customer updated successfully');
      } else {
        await customerService.createCustomer(formData);
        setSuccessMsg('Customer created successfully');
      }
      setIsModalOpen(false);
      fetchCustomers(pagination.page, search);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      await customerService.deleteCustomer(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setSuccessMsg('Customer deleted successfully');
      fetchCustomers(pagination.page, search);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(msg);
      setIsDeleteModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const { language, t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('customersTitle')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('customersSubtitle')}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addCustomer')}
        </button>
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

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchCustomerPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {t('search').replace('...', '')}
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchCustomers(1, '');
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
            >
              {language === 'bn' ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
            <p className="text-xs text-gray-500 font-medium">{t('loading')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{t('noCustomersFound')}</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search
                ? (language === 'bn' ? 'অনুসন্ধানের সাথে কোনো গ্রাহক মিলেনি। অন্য কিছু লিখে খুঁজুন।' : 'No customers match your search criteria. Try a different query.')
                : t('noCustomersDesc')}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('addFirstCustomer')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">{t('customerName')}</th>
                    <th className="py-3.5 px-4">{t('contactInfo')}</th>
                    <th className="py-3.5 px-4">{t('address')}</th>
                    <th className="py-3.5 px-4">{t('created')}</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-gray-900 text-sm">{c.name}</div>
                        {c.notes && (
                          <div className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                            {c.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 space-y-1">
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {!c.email && !c.phone && (
                          <span className="text-gray-400 text-xs italic">No contact info</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {c.address ? (
                          <div className="flex items-center gap-1.5 text-xs max-w-xs truncate">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(c._id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <div>
                  Showing page <span className="font-semibold text-gray-800">{pagination.page}</span>{' '}
                  of <span className="font-semibold text-gray-800">{pagination.totalPages}</span>{' '}
                  ({pagination.total} total customers)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchCustomers(pagination.page - 1, search)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchCustomers(pagination.page + 1, search)}
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

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Customer / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Industries Ltd."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="accounts@acme.com"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, State, ZIP, Country"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Payment terms, special discounts, or account manager"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Delete Customer</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this customer? This action cannot be undone if no associated invoices exist.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

