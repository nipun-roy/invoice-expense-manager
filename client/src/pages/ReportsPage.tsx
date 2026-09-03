import React, { useState, useEffect, useCallback } from 'react';
import {
  reportService,
  IncomeReportData,
  ExpenseReportData,
  ProfitSummaryData,
  InvoiceReportData,
} from '../services/report.service';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  Loader2,
  DollarSign,
  PieChart,
  Layers,
  ArrowUpRight,
  Receipt,
  FileText,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.businessProfile?.defaultCurrency || 'BDT';

  const [activeTab, setActiveTab] = useState<'profit' | 'income' | 'expense' | 'invoice'>('profit');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [profitData, setProfitData] = useState<ProfitSummaryData | null>(null);
  const [incomeData, setIncomeData] = useState<IncomeReportData | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseReportData | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceReportData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        dateFilter: dateFilter === 'all' ? undefined : dateFilter,
        startDate: dateFilter === 'custom' ? startDate : undefined,
        endDate: dateFilter === 'custom' ? endDate : undefined,
      };

      const [profit, income, expense, invoice] = await Promise.all([
        reportService.getProfitSummary(params),
        reportService.getIncomeReport(params),
        reportService.getExpenseReport(params),
        reportService.getInvoiceReport(params),
      ]);

      setProfitData(profit);
      setIncomeData(income);
      setExpenseData(expense);
      setInvoiceData(invoice);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate financial reports';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('reportsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('reportsSubtitle')}
          </p>
        </div>

        {/* Date Filter Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            >
              <option value="this_month">{t('thisMonth')}</option>
              <option value="last_month">{t('lastMonth')}</option>
              <option value="this_year">{t('thisYear')}</option>
              <option value="this_week">{t('thisWeek')}</option>
              <option value="today">{t('today')}</option>
              <option value="all">{t('allTime')}</option>
              <option value="custom">{t('customRange')}</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {[
            { id: 'profit', label: t('tabProfit'), icon: BarChart3 },
            { id: 'income', label: t('tabIncome'), icon: TrendingUp },
            { id: 'expense', label: t('tabExpense'), icon: TrendingDown },
            { id: 'invoice', label: t('tabInvoice'), icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-colors ${
                  active
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-xs text-gray-500 font-medium">{t('aggregatingReports')}</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PROFIT SUMMARY */}
          {activeTab === 'profit' && profitData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Revenue Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('collectedRevenue')}
                    </span>
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <span className="text-2xl font-bold font-mono text-gray-900">
                      {currency} {profitData.revenue.toFixed(2)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{t('paidInvoiceReceipts')}</p>
                  </div>
                </div>

                {/* Expenses Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('totalExpenses')}
                    </span>
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <span className="text-2xl font-bold font-mono text-gray-900">
                      {currency} {profitData.expenses.toFixed(2)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{t('operatingCosts')}</p>
                  </div>
                </div>

                {/* Net Profit Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('netProfit')}
                    </span>
                    <div
                      className={`p-2 rounded-lg ${
                        profitData.netProfit >= 0
                          ? 'bg-sky-50 text-sky-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <span
                      className={`text-2xl font-bold font-mono ${
                        profitData.netProfit >= 0 ? 'text-sky-700' : 'text-rose-600'
                      }`}
                    >
                      {currency} {profitData.netProfit.toFixed(2)}
                    </span>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      {t('margin')}:{' '}
                      <span className="font-semibold text-gray-800">
                        {profitData.marginPercentage}%
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Overview Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {t('financialHighlights')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 block mb-1">{t('totalBilled')}</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {currency} {incomeData?.totalBilled.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 block mb-1">{t('uncollectedBalance')}</span>
                      <span className="font-mono font-bold text-amber-600 text-sm">
                        {currency} {invoiceData?.totalOutstanding.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCOME REPORT */}
          {activeTab === 'income' && incomeData && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Income & Billing Breakdown
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Total Collected: {currency} {incomeData.totalIncome.toFixed(2)} across {incomeData.invoiceCount} invoices
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-gray-500">Billed: </span>
                  <span className="font-semibold text-gray-800">
                    {currency} {incomeData.totalBilled.toFixed(2)}
                  </span>
                </div>
              </div>

              {incomeData.monthlyBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No income records in the selected timeframe.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-semibold border-b border-gray-100">
                      <tr>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4 text-center">Invoices</th>
                        <th className="py-3 px-4 text-right">Total Billed</th>
                        <th className="py-3 px-4 text-right">Total Collected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incomeData.monthlyBreakdown.map((m, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-semibold text-gray-800">{m.label}</td>
                          <td className="py-3 px-4 text-center text-gray-500">{m.count}</td>
                          <td className="py-3 px-4 text-right font-mono text-gray-700">
                            {currency} {m.billed.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                            {currency} {m.collected.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPENSE REPORT */}
          {activeTab === 'expense' && expenseData && (
            <div className="space-y-6">
              {/* Category Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Category Breakdown
                  </h3>
                  <span className="text-xs font-mono font-bold text-rose-600">
                    Total: {currency} {expenseData.totalExpenses.toFixed(2)}
                  </span>
                </div>

                {expenseData.categoryBreakdown.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">
                    No expense records in this timeframe.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {expenseData.categoryBreakdown.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-800">{cat.categoryName}</span>
                          <span className="font-mono font-semibold text-gray-900">
                            {currency} {cat.amount.toFixed(2)}{' '}
                            <span className="text-gray-400 font-normal">({cat.percentage}%)</span>
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, cat.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INVOICE REPORT */}
          {activeTab === 'invoice' && invoiceData && (
            <div className="space-y-6">
              {/* Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: 'Paid', stat: invoiceData.statusBreakdown.paid, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { label: 'Sent', stat: invoiceData.statusBreakdown.sent, color: 'text-sky-700 bg-sky-50 border-sky-200' },
                  { label: 'Draft', stat: invoiceData.statusBreakdown.draft, color: 'text-slate-700 bg-slate-100 border-slate-200' },
                  { label: 'Overdue', stat: invoiceData.statusBreakdown.overdue, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                  { label: 'Cancelled', stat: invoiceData.statusBreakdown.cancelled, color: 'text-rose-700 bg-rose-50 border-rose-200' },
                ].map((s) => (
                  <div key={s.label} className={`p-4 rounded-xl border ${s.color}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider block mb-1">
                      {s.label}
                    </span>
                    <span className="text-xl font-bold font-mono block">
                      {s.stat?.count || 0}
                    </span>
                    <span className="text-xs font-mono opacity-80 block mt-1">
                      {currency} {(s.stat?.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">Total Invoiced</span>
                  <span className="text-lg font-bold font-mono text-gray-900">
                    {currency} {invoiceData.totalBilled.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-700 block mb-1">Total Paid</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">
                    {currency} {invoiceData.totalPaid.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="text-xs text-amber-700 block mb-1">Total Outstanding</span>
                  <span className="text-lg font-bold font-mono text-amber-700">
                    {currency} {invoiceData.totalOutstanding.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;

