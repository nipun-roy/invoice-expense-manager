import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  dashboardService,
  DashboardData,
} from '../services/dashboard.service';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  FileText,
  Receipt,
  ArrowUpRight,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  Ban,
  ArrowRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const business = user?.businessProfile;
  const currency = business?.defaultCurrency || 'BDT';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService
      .getMetrics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load dashboard metrics';
        setError(msg);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">{t('loading')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-gray-200 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-semibold text-gray-900">{t('dashboardTitle')}</h3>
        <p className="text-xs text-gray-500">{error || 'Could not fetch metrics'}</p>
      </div>
    );
  }

  const { metrics, monthlyOverview, recentInvoices, recentExpenses } = data;

  // Compute maximum value for SVG chart scaling
  const maxChartVal = Math.max(
    ...monthlyOverview.map((m) => Math.max(m.revenue, m.expenses, 1)),
    100
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-sky-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/30 text-sky-200 border border-sky-400/30">
              {t('liveTelemetry')}
            </span>
            <span className="text-xs text-sky-200 font-mono">
              {business?.businessName || 'My Business'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t('dashboardTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-sky-200 mt-1 max-w-2xl">
            {t('dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('newInvoice')}
          </Link>
          <Link
            to="/expenses"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <Receipt className="w-4 h-4" />
            {t('addExpense')}
          </Link>
        </div>
      </div>

      {/* 4 Primary Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('totalRevenue')}</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-gray-900 block">
            {currency} {metrics.totalRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">{t('revenueSub')}</span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('totalExpenses')}</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-gray-900 block">
            {currency} {metrics.totalExpenses.toFixed(2)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">{t('expenseSub')}</span>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('netProfit')}</span>
            <div
              className={`p-2 rounded-lg ${
                metrics.netProfit >= 0
                  ? 'bg-sky-50 text-sky-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span
            className={`text-2xl font-bold font-mono block ${
              metrics.netProfit >= 0 ? 'text-sky-700' : 'text-rose-600'
            }`}
          >
            {currency} {metrics.netProfit.toFixed(2)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">{t('profitSub')}</span>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('totalOutstanding')}</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-amber-600 block">
            {currency} {metrics.totalOutstanding.toFixed(2)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">{t('outstandingSub')}</span>
        </div>
      </div>

      {/* Invoice Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <span className="text-xs text-gray-500 block mb-1">{t('paidInvoices')}</span>
          <span className="text-lg font-bold font-mono text-emerald-600">{metrics.paidInvoices}</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <span className="text-xs text-gray-500 block mb-1">{t('unpaidInvoices')}</span>
          <span className="text-lg font-bold font-mono text-sky-600">{metrics.unpaidInvoices}</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <span className="text-xs text-gray-500 block mb-1">{t('overdueInvoices')}</span>
          <span className="text-lg font-bold font-mono text-amber-600">{metrics.overdueInvoices}</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <span className="text-xs text-gray-500 block mb-1">{t('totalCreated')}</span>
          <span className="text-lg font-bold font-mono text-slate-800">{metrics.totalInvoices}</span>
        </div>
      </div>

      {/* 6 Months Financial Overview Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t('monthlyOverview')}
            </h3>
            <p className="text-xs text-gray-500">
              {t('monthlyOverviewSub')}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-gray-600">{t('totalRevenue')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-400" />
              <span className="text-gray-600">{t('totalExpenses')}</span>
            </div>
          </div>
        </div>

        {/* Pure CSS/SVG Responsive Bar Chart */}
        <div className="pt-4">
          <div className="grid grid-cols-6 gap-2 sm:gap-6 items-end h-48 border-b border-gray-200 pb-2">
            {monthlyOverview.map((pt, idx) => {
              const revHeight = Math.max(4, Math.round((pt.revenue / maxChartVal) * 160));
              const expHeight = Math.max(4, Math.round((pt.expenses / maxChartVal) * 160));

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="flex items-end gap-1.5 w-full justify-center">
                    {/* Revenue Bar */}
                    <div
                      className="w-3 sm:w-5 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:bg-emerald-600"
                      style={{ height: `${revHeight}px` }}
                      title={`Revenue: ${currency} ${pt.revenue}`}
                    />
                    {/* Expense Bar */}
                    <div
                      className="w-3 sm:w-5 bg-rose-400 rounded-t-sm transition-all duration-300 hover:bg-rose-500"
                      style={{ height: `${expHeight}px` }}
                      title={`Expenses: ${currency} ${pt.expenses}`}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 truncate w-full text-center">
                    {pt.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dual Recent Tables: Recent Invoices & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              {t('recentInvoices')}
            </h3>
            <Link
              to="/invoices"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">{t('noInvoicesFound')}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentInvoices.map((inv) => {
                const cName =
                  typeof inv.customer === 'object' && inv.customer !== null
                    ? (inv.customer as any).name
                    : 'Customer';

                return (
                  <div key={inv._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="font-mono font-semibold text-sky-600 hover:underline block"
                      >
                        #{inv.invoiceNumber}
                      </Link>
                      <span className="text-gray-500 text-[11px] truncate max-w-[160px] block">
                        {cName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-gray-900 block">
                        {currency} {inv.grandTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              {t('recentExpenses')}
            </h3>
            <Link
              to="/expenses"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No expenses recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentExpenses.map((exp) => {
                const catName =
                  typeof exp.category === 'object' && exp.category !== null
                    ? exp.category.name
                    : 'Uncategorized';

                return (
                  <div key={exp._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-gray-800 block truncate max-w-[180px]">
                        {exp.title}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {catName} &bull; {exp.date ? new Date(exp.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-rose-600 block">
                        -{currency} {exp.amount.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        {exp.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
