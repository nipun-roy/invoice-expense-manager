import { Invoice, InvoiceStatusEnum } from '../models/Invoice.js';
import { Expense } from '../models/Expense.js';
import mongoose from 'mongoose';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const getDashboardMetrics = async (userId: string) => {
  const userObjId = new mongoose.Types.ObjectId(userId);

  // 1. Invoices Aggregation
  const invoiceAgg = await Invoice.aggregate([
    { $match: { user: userObjId } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amountPaid' },
        totalOutstanding: {
          $sum: {
            $cond: [{ $ne: ['$status', InvoiceStatusEnum.CANCELLED] }, '$amountDue', 0],
          },
        },
        paidInvoices: {
          $sum: { $cond: [{ $eq: ['$status', InvoiceStatusEnum.PAID] }, 1, 0] },
        },
        unpaidInvoices: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$status', [InvoiceStatusEnum.DRAFT, InvoiceStatusEnum.SENT]] },
                  { $gt: ['$amountDue', 0] },
                ],
              },
              1,
              0,
            ],
          },
        },
        overdueInvoices: {
          $sum: { $cond: [{ $eq: ['$status', InvoiceStatusEnum.OVERDUE] }, 1, 0] },
        },
        totalInvoices: { $sum: 1 },
      },
    },
  ]);

  const invoiceStats = invoiceAgg[0] || {
    totalRevenue: 0,
    totalOutstanding: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0,
    totalInvoices: 0,
  };

  // 2. Expenses Aggregation
  const expenseAgg = await Expense.aggregate([
    { $match: { user: userObjId } },
    { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
  ]);

  const totalRevenue = round2(invoiceStats.totalRevenue || 0);
  const totalExpenses = round2(expenseAgg[0]?.totalExpenses || 0);
  const netProfit = round2(totalRevenue - totalExpenses);
  const totalOutstanding = round2(invoiceStats.totalOutstanding || 0);

  // 3. Recent 5 Invoices & Recent 5 Expenses
  const [recentInvoices, recentExpenses] = await Promise.all([
    Invoice.find({ user: userObjId })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5),
    Expense.find({ user: userObjId })
      .populate('category', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(5),
  ]);

  // 4. Last 6 Months Overview for Chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [monthlyInvoices, monthlyExpenses] = await Promise.all([
    Invoice.aggregate([
      {
        $match: {
          user: userObjId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amountPaid' },
          billed: { $sum: '$grandTotal' },
        },
      },
    ]),
    Expense.aggregate([
      {
        $match: {
          user: userObjId,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          expenses: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  // Build sequential 6 month timeline
  const monthlyTimeline = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    const label = d.toLocaleString('default', { month: 'short' });

    const invMonth = monthlyInvoices.find(
      (m) => m._id.year === yr && m._id.month === mo
    );
    const expMonth = monthlyExpenses.find(
      (m) => m._id.year === yr && m._id.month === mo
    );

    const rev = round2(invMonth?.revenue || 0);
    const exp = round2(expMonth?.expenses || 0);

    monthlyTimeline.push({
      year: yr,
      month: mo,
      label: `${label} ${yr}`,
      revenue: rev,
      expenses: exp,
      profit: round2(rev - exp),
    });
  }

  return {
    metrics: {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalOutstanding,
      paidInvoices: invoiceStats.paidInvoices,
      unpaidInvoices: invoiceStats.unpaidInvoices,
      overdueInvoices: invoiceStats.overdueInvoices,
      totalInvoices: invoiceStats.totalInvoices,
    },
    monthlyOverview: monthlyTimeline,
    recentInvoices,
    recentExpenses,
  };
};

