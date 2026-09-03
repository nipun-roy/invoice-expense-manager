import React, { useState, useEffect, useCallback } from 'react';
import {
  expenseService,
  ExpenseData,
  ExpenseCategoryData,
} from '../services/expense.service';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import {
  Receipt,
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
  Calendar,
  CreditCard,
  Settings2,
  TrendingDown,
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.businessProfile?.defaultCurrency || 'BDT';

  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseModalError, setExpenseModalError] = useState<string | null>(null);

  // Categories Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);

  // Delete Expense Confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const cats = await expenseService.getCategories();
      setCategories(cats);
    } catch (err: unknown) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchExpenses = useCallback(
    async (
      pageToLoad = 1,
      searchQuery = search,
      cat = categoryFilter,
      dFilter = dateFilter
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await expenseService.getExpenses({
          page: pageToLoad,
          limit: 10,
          search: searchQuery.trim() || undefined,
          category: cat || undefined,
          dateFilter: dFilter === 'all' ? undefined : dFilter,
        });
        setExpenses(data.expenses);
        setTotalAmount(data.totalAmount);
        setPagination(data.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load expenses';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [search, categoryFilter, dateFilter]
  );

  useEffect(() => {
    fetchCategories();
    fetchExpenses(1, search, categoryFilter, dateFilter);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses(1, search, categoryFilter, dateFilter);
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: '',
      category: categories[0]?._id || '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      notes: '',
    });
    setExpenseModalError(null);
    setIsExpenseModalOpen(true);
  };

  const openEditModal = (exp: ExpenseData) => {
    setEditingExpense(exp);
    const catId =
      typeof exp.category === 'object' && exp.category !== null
        ? exp.category._id
        : (exp.category as string);

    setExpenseForm({
      title: exp.title,
      category: catId,
      amount: exp.amount,
      date: exp.date ? exp.date.split('T')[0] : '',
      paymentMethod: exp.paymentMethod,
      notes: exp.notes || '',
    });
    setExpenseModalError(null);
    setIsExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title.trim()) {
      setExpenseModalError('Expense title is required');
      return;
    }
    if (!expenseForm.category) {
      setExpenseModalError('Please select an expense category');
      return;
    }
    if (expenseForm.amount <= 0) {
      setExpenseModalError('Amount must be greater than 0');
      return;
    }

    setSubmittingExpense(true);
    setExpenseModalError(null);
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense._id, expenseForm);
        setSuccessMsg('Expense updated successfully');
      } else {
        await expenseService.createExpense(expenseForm);
        setSuccessMsg('Expense recorded successfully');
      }
      setIsExpenseModalOpen(false);
      fetchExpenses(pagination.page, search, categoryFilter, dateFilter);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setExpenseModalError(msg);
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingId) return;
    setSubmittingExpense(true);
    try {
      await expenseService.deleteExpense(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setSuccessMsg('Expense deleted successfully');
      fetchExpenses(pagination.page, search, categoryFilter, dateFilter);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete expense';
      setError(msg);
      setIsDeleteModalOpen(false);
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Category management handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategoryActionLoading(true);
    setCategoryModalError(null);
    try {
      await expenseService.createCategory(newCategoryName.trim());
      setNewCategoryName('');
      await fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add category';
      setCategoryModalError(msg);
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setCategoryActionLoading(true);
    setCategoryModalError(null);
    try {
      await expenseService.deleteCategory(catId);
      await fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
      setCategoryModalError(msg);
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('expensesTitle')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('expensesSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium transition-colors shadow-sm"
          >
            <Settings2 className="w-4 h-4 text-gray-500" />
            {t('categories')}
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('recordExpenseBtn')}
          </button>
        </div>
      </div>

      {/* Total Expense Highlight Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              {t('totalFilteredExpenses')}
            </span>
            <span className="text-xl font-bold text-gray-900 font-mono">
              {currency} {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500 hidden sm:block">
          {pagination.total} matching records
        </div>
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

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or notes..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            fetchExpenses(1, search, e.target.value, dateFilter);
          }}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Date Filter Presets */}
        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            fetchExpenses(1, search, categoryFilter, e.target.value);
          }}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No expenses found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search || categoryFilter || dateFilter !== 'all'
                ? 'No expenses match the specified filters.'
                : 'Start tracking vendor payments and operating costs.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Record First Expense
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Title / Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((exp) => {
                    const catName =
                      typeof exp.category === 'object' && exp.category !== null
                        ? exp.category.name
                        : 'Uncategorized';

                    return (
                      <tr key={exp._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-semibold text-gray-900 text-sm">
                            {exp.title}
                          </div>
                          {exp.notes && (
                            <div className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                              {exp.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {catName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {exp.date ? new Date(exp.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          <span className="text-[11px] font-mono text-gray-500">
                            {exp.paymentMethod.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-600">
                          -{currency} {exp.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(exp)}
                              className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingId(exp._id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                  ({pagination.total} total items)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      fetchExpenses(
                        pagination.page - 1,
                        search,
                        categoryFilter,
                        dateFilter
                      )
                    }
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      fetchExpenses(
                        pagination.page + 1,
                        search,
                        categoryFilter,
                        dateFilter
                      )
                    }
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

      {/* Add / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                {editingExpense ? 'Edit Expense Record' : 'Record Business Expense'}
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              {expenseModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{expenseModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Expense Title / Payee <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. AWS Cloud Hosting / Office Supplies"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Amount ({currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                  Notes / Receipt Reference
                </label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Receipt number, transaction memo, or vendor details"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {submittingExpense && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Manage Expense Categories</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {categoryModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{categoryModalError}</span>
                </div>
              )}

              {/* Add New Category */}
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={categoryActionLoading || !newCategoryName.trim()}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>

              {/* Category List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {categories.map((c) => (
                  <div
                    key={c._id}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(c._id)}
                      disabled={categoryActionLoading}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded"
                      title="Delete category (blocked if in use)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Categories in use by existing expenses cannot be deleted to preserve financial audit integrity.
              </p>
            </div>
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
              <h3 className="text-sm font-semibold text-gray-900">Delete Expense</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this expense record? This will adjust your total expense calculations.
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
                onClick={handleDeleteExpense}
                disabled={submittingExpense}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {submittingExpense && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;

