import { Invoice, InvoiceStatusEnum } from '../models/Invoice.js';
import { Expense } from '../models/Expense.js';
import { parseDateRange } from '../utils/dateRange.js';
import mongoose from 'mongoose';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const getIncomeReport = async (
  userId: string,
  dateFilter?: string,
  startDate?: string,
  endDate?: string
) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const filter: Record<string, any> = { user: userObjId };

  const range = parseDateRange(dateFilter, startDate, endDate);
  if (range) {
    filter.createdAt = { $gte: range.startDate, $lte: range.endDate };
  }

  const [invoicesAgg, monthlyAgg] = await Promise.all([
    Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amountPaid' },
          totalBilled: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          collected: { $sum: '$amountPaid' },
          billed: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const totalCollected = round2(invoicesAgg[0]?.totalCollected || 0);
  const totalBilled = round2(invoicesAgg[0]?.totalBilled || 0);

  const monthlyBreakdown = monthlyAgg.map((m) => {
    const d = new Date(m._id.year, m._id.month - 1, 1);
    return {
      year: m._id.year,
      month: m._id.month,
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      collected: round2(m.collected),
      billed: round2(m.billed),
      count: m.count,
    };
  });

  return {
    dateRange: range || 'All Time',
    totalIncome: totalCollected,
    totalBilled,
    invoiceCount: invoicesAgg[0]?.count || 0,
    monthlyBreakdown,
  };
};

export const getExpenseReport = async (
  userId: string,
  dateFilter?: string,
  startDate?: string,
  endDate?: string
) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const filter: Record<string, any> = { user: userObjId };

  const range = parseDateRange(dateFilter, startDate, endDate);
  if (range) {
    filter.date = { $gte: range.startDate, $lte: range.endDate };
  }

  const [totalAgg, categoryAgg, monthlyAgg] = await Promise.all([
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'expensecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      { $sort: { amount: -1 } },
    ]),
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const totalExpense = round2(totalAgg[0]?.total || 0);

  const categoryBreakdown = categoryAgg.map((c) => ({
    categoryId: c._id,
    categoryName: c.categoryDoc?.name || 'Uncategorized',
    amount: round2(c.amount),
    count: c.count,
    percentage: totalExpense > 0 ? round2((c.amount / totalExpense) * 100) : 0,
  }));

  const monthlyBreakdown = monthlyAgg.map((m) => {
    const d = new Date(m._id.year, m._id.month - 1, 1);
    return {
      year: m._id.year,
      month: m._id.month,
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      total: round2(m.total),
      count: m.count,
    };
  });

  return {
    dateRange: range || 'All Time',
    totalExpenses: totalExpense,
    expenseCount: totalAgg[0]?.count || 0,
    categoryBreakdown,
    monthlyBreakdown,
  };
};

export const getProfitSummary = async (
  userId: string,
  dateFilter?: string,
  startDate?: string,
  endDate?: string
) => {
  const [income, expenses] = await Promise.all([
    getIncomeReport(userId, dateFilter, startDate, endDate),
    getExpenseReport(userId, dateFilter, startDate, endDate),
  ]);

  const revenue = income.totalIncome;
  const expenseTotal = expenses.totalExpenses;
  const netProfit = round2(revenue - expenseTotal);
  const marginPercentage =
    revenue > 0 ? round2((netProfit / revenue) * 100) : 0;

  return {
    dateRange: income.dateRange,
    revenue,
    expenses: expenseTotal,
    netProfit,
    marginPercentage,
  };
};

export const getInvoiceReport = async (
  userId: string,
  dateFilter?: string,
  startDate?: string,
  endDate?: string
) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const filter: Record<string, any> = { user: userObjId };

  const range = parseDateRange(dateFilter, startDate, endDate);
  if (range) {
    filter.createdAt = { $gte: range.startDate, $lte: range.endDate };
  }

  const [statsAgg, statusAgg] = await Promise.all([
    Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalOutstanding: {
            $sum: {
              $cond: [{ $ne: ['$status', InvoiceStatusEnum.CANCELLED] }, '$amountDue', 0],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$grandTotal' },
        },
      },
    ]),
  ]);

  const stats = statsAgg[0] || {
    totalBilled: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalCount: 0,
  };

  const statusMap: Record<string, { count: number; totalAmount: number }> = {};
  statusAgg.forEach((s) => {
    statusMap[s._id] = { count: s.count, totalAmount: round2(s.totalAmount) };
  });

  return {
    dateRange: range || 'All Time',
    totalInvoices: stats.totalCount,
    totalBilled: round2(stats.totalBilled),
    totalPaid: round2(stats.totalPaid),
    totalOutstanding: round2(stats.totalOutstanding),
    statusBreakdown: {
      draft: statusMap[InvoiceStatusEnum.DRAFT] || { count: 0, totalAmount: 0 },
      sent: statusMap[InvoiceStatusEnum.SENT] || { count: 0, totalAmount: 0 },
      paid: statusMap[InvoiceStatusEnum.PAID] || { count: 0, totalAmount: 0 },
      overdue: statusMap[InvoiceStatusEnum.OVERDUE] || { count: 0, totalAmount: 0 },
      cancelled: statusMap[InvoiceStatusEnum.CANCELLED] || { count: 0, totalAmount: 0 },
    },
  };
};

