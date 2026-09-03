import React, { useState, useEffect, useCallback } from 'react';
import {
  productService,
  ProductData,
} from '../services/product.service';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Tag,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.businessProfile?.defaultCurrency || 'BDT';

  const [products, setProducts] = useState<ProductData[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    unit: 'item',
    taxRate: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchProducts = useCallback(
    async (pageToLoad = 1, searchQuery = search, status = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const data = await productService.getProducts({
          page: pageToLoad,
          limit: 10,
          search: searchQuery.trim() || undefined,
          isActive: status === 'all' ? undefined : status,
        });
        setProducts(data.products);
        setPagination(data.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load products';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    fetchProducts(1, search, statusFilter);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1, search, statusFilter);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      unit: 'item',
      taxRate: 0,
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductData) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      unit: product.unit || 'item',
      taxRate: product.taxRate || 0,
      isActive: product.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Product/Service name is required');
      return;
    }

    if (formData.price < 0) {
      setModalError('Price cannot be negative');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, formData);
        setSuccessMsg('Product updated successfully');
      } else {
        await productService.createProduct(formData);
        setSuccessMsg('Product created successfully');
      }
      setIsModalOpen(false);
      fetchProducts(pagination.page, search, statusFilter);
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
      await productService.deleteProduct(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setSuccessMsg('Product deleted successfully');
      fetchProducts(pagination.page, search, statusFilter);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('productsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('productsSubtitle')}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addProduct')}
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchProductPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {t('search').replace('...', '')}
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value as 'all' | 'true' | 'false';
              setStatusFilter(val);
              fetchProducts(1, search, val);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="true">{t('activeItems')}</option>
            <option value="false">{t('inactiveItems')}</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
            <p className="text-xs text-gray-500 font-medium">{t('loading')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{t('noProductsFound')}</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {t('noProductsDesc')}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('addFirstProduct')}
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">{language === 'bn' ? 'পণ্যের নাম ও বিবরণ' : 'Name / Description'}</th>
                    <th className="py-3.5 px-4">{language === 'bn' ? 'মূল্য ও একক' : 'Rate / Unit'}</th>
                    <th className="py-3.5 px-4">{language === 'bn' ? 'ভ্যাট / ট্যাক্স' : 'Tax Rate'}</th>
                    <th className="py-3.5 px-4">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-sky-600" />
                          <span>{p.name}</span>
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-gray-500 truncate max-w-sm mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-800 font-medium">
                        {currency} {p.price.toFixed(2)}{' '}
                        <span className="text-gray-400 font-normal">/ {p.unit || 'item'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {p.taxRate > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 font-medium text-[11px]">
                            {p.taxRate}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">0%</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-medium border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-medium border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(p._id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Item"
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
                  ({pagination.total} total items)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchProducts(pagination.page - 1, search, statusFilter)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchProducts(pagination.page + 1, search, statusFilter)}
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                {editingProduct ? 'Edit Catalog Item' : 'Add New Item'}
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
                  Item Name / Service Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Web Development / Widget Model X"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description that will populate invoice line items"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Price ({currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="item / hr / month"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className="flex items-center gap-2 text-xs font-medium text-gray-700 focus:outline-none"
                >
                  {formData.isActive ? (
                    <ToggleRight className="w-6 h-6 text-sky-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <span>Item is Active for new invoices</span>
                </button>
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
                  {editingProduct ? 'Save Changes' : 'Create Item'}
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
              <h3 className="text-sm font-semibold text-gray-900">Delete Product</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this catalog item? Existing issued invoices will maintain their item snapshots.
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

export default ProductsPage;

