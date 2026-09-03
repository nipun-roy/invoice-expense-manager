process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './server.js';

async function runMoneyTests() {
  console.log('====================================================');
  console.log('🚀 TESTING MONEY MANAGEMENT, DASHBOARD & REPORTING');
  console.log('====================================================\n');

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);

  const PORT = 5004;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api`;

  try {
    // 1. Setup User A & User B
    console.log('--- Step 1: Register User A and User B ---');
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alpha Finance', email: 'alpha@finance.io', password: 'password123' }),
    });
    const cookieA = regResA.headers.get('set-cookie')?.split(';')[0] || '';

    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Beta Finance', email: 'beta@finance.io', password: 'password123' }),
    });
    const cookieB = regResB.headers.get('set-cookie')?.split(';')[0] || '';

    // 2. Expense Category Tests
    console.log('\n--- Step 2: Expense Category CRUD ---');
    const catListRes = await fetch(`${BASE_URL}/expense-categories`, { headers: { Cookie: cookieA } });
    const catListData = (await catListRes.json()) as any;
    console.log('Default Categories Seeded:', catListData.data.length);
    if (catListData.data.length === 0) throw new Error('Default categories were not seeded');

    // Create custom category
    const createCatRes = await fetch(`${BASE_URL}/expense-categories`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Equipment Lease' }),
    });
    const createCatData = (await createCatRes.json()) as any;
    console.log('Create Category Status:', createCatRes.status);
    if (createCatRes.status !== 201) throw new Error('Failed to create category');
    const categoryId = createCatData.data._id;

    // 3. Expense CRUD Tests
    console.log('\n--- Step 3: Expense Management CRUD ---');
    const expRes = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'MacBook Pro Lease Payment',
        category: categoryId,
        amount: 250.75,
        date: new Date().toISOString(),
        paymentMethod: 'CREDIT_CARD',
        notes: 'Monthly hardware expense',
      }),
    });
    const expData = (await expRes.json()) as any;
    console.log('Create Expense Status:', expRes.status);
    console.log('Recorded Amount:', expData.data.amount);
    if (expRes.status !== 201 || expData.data.amount !== 250.75) throw new Error('Create expense failed');
    const expenseId = expData.data._id;

    // Attempt deleting category while in use (must be blocked with 400)
    const delCatInUse = await fetch(`${BASE_URL}/expense-categories/${categoryId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieA },
    });
    console.log('Delete Category in use Status (expected 400):', delCatInUse.status);
    if (delCatInUse.status !== 400) throw new Error('Failed to protect in-use category from deletion');

    // Add a second expense for testing aggregation
    await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Office Coffee Supplies',
        category: catListData.data[0]._id,
        amount: 49.25,
        date: new Date().toISOString(),
        paymentMethod: 'CASH',
      }),
    });

    // 4. Invoices & Payment Management Tests
    console.log('\n--- Step 4: Invoice & Payment Recording ---');
    // Create customer
    const custRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Enterprise Client Ltd', email: 'corp@enterprise.com' }),
    });
    const custData = (await custRes.json()) as any;
    const customerId = custData.data._id;

    // Create Invoice for $1000
    const invRes = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: customerId,
        items: [{ description: 'Custom Software License', quantity: 1, unitPrice: 1000, taxRate: 0 }],
      }),
    });
    const invData = (await invRes.json()) as any;
    const invoiceId = invData.data._id;
    console.log('Invoice Created with Grand Total:', invData.data.grandTotal, 'Amount Due:', invData.data.amountDue);

    // Test Overpayment Prevention (Attempt to pay $1200 on $1000 invoice)
    const overpayRes = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice: invoiceId,
        amount: 1200,
        method: 'BANK_TRANSFER',
      }),
    });
    console.log('Overpayment Status (expected 400):', overpayRes.status);
    if (overpayRes.status !== 400) throw new Error('Overpayment was not blocked');

    // Record Partial Payment of $400
    const partPayRes = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice: invoiceId,
        amount: 400,
        method: 'BANK_TRANSFER',
        notes: 'Deposit payment',
      }),
    });
    const partPayData = (await partPayRes.json()) as any;
    console.log('Partial Payment Status:', partPayRes.status);
    console.log('Invoice Amount Paid:', partPayData.invoice.amountPaid, 'Amount Due:', partPayData.invoice.amountDue);
    if (partPayData.invoice.amountPaid !== 400 || partPayData.invoice.amountDue !== 600) {
      throw new Error('Partial payment calculation mismatch');
    }

    // Record Final Payment of remaining $600
    const finalPayRes = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice: invoiceId,
        amount: 600,
        method: 'CREDIT_CARD',
      }),
    });
    const finalPayData = (await finalPayRes.json()) as any;
    console.log('Final Payment Status:', finalPayRes.status);
    console.log('Updated Status:', finalPayData.invoice.status, 'Amount Due:', finalPayData.invoice.amountDue);
    if (finalPayData.invoice.status !== 'PAID' || finalPayData.invoice.amountDue !== 0) {
      throw new Error('Final payment did not set invoice status to PAID');
    }

    // 5. Cross-User IDOR Security Checks
    console.log('\n--- Step 5: IDOR & Cross-User Protection ---');
    const idorExp = await fetch(`${BASE_URL}/expenses/${expenseId}`, { headers: { Cookie: cookieB } });
    console.log('User B access to User A expense:', idorExp.status);
    if (idorExp.status !== 404) throw new Error('IDOR vulnerability on Expense!');

    const idorPay = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { Cookie: cookieB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice: invoiceId, amount: 100 }),
    });
    console.log('User B payment against User A invoice:', idorPay.status);
    if (idorPay.status !== 404) throw new Error('IDOR vulnerability on Payment!');

    // 6. Dashboard Metrics Verification
    console.log('\n--- Step 6: Dashboard Metrics Verification ---');
    const dashRes = await fetch(`${BASE_URL}/dashboard`, { headers: { Cookie: cookieA } });
    const dashData = (await dashRes.json()) as any;
    console.log('Dashboard Status:', dashRes.status);
    console.log('Metrics:', JSON.stringify(dashData.data.metrics));

    // Total Revenue = $1000, Total Expenses = 250.75 + 49.25 = $300, Net Profit = $700
    if (
      dashData.data.metrics.totalRevenue !== 1000 ||
      dashData.data.metrics.totalExpenses !== 300 ||
      dashData.data.metrics.netProfit !== 700 ||
      dashData.data.metrics.paidInvoices !== 1
    ) {
      throw new Error('Dashboard financial calculation mismatch!');
    }
    console.log('✅ Dashboard financial metrics 100% accurate.');

    // 7. Report Calculations & Date Filtering Verification
    console.log('\n--- Step 7: Reports & Date Filtering ---');
    const incomeRep = await fetch(`${BASE_URL}/reports/income?dateFilter=this_month`, {
      headers: { Cookie: cookieA },
    });
    const incomeData = (await incomeRep.json()) as any;
    console.log('Income Report Total:', incomeData.data.totalIncome);
    if (incomeData.data.totalIncome !== 1000) throw new Error('Income report mismatch');

    const expRep = await fetch(`${BASE_URL}/reports/expenses?dateFilter=this_month`, {
      headers: { Cookie: cookieA },
    });
    const expRepData = (await expRep.json()) as any;
    console.log('Expense Report Total:', expRepData.data.totalExpenses);
    console.log('Categories in Report:', expRepData.data.categoryBreakdown.length);
    if (expRepData.data.totalExpenses !== 300) throw new Error('Expense report mismatch');

    const profitRep = await fetch(`${BASE_URL}/reports/profit?dateFilter=this_month`, {
      headers: { Cookie: cookieA },
    });
    const profitData = (await profitRep.json()) as any;
    console.log('Profit Report Net:', profitData.data.netProfit, 'Margin:', profitData.data.marginPercentage + '%');
    if (profitData.data.netProfit !== 700 || profitData.data.marginPercentage !== 70) {
      throw new Error('Profit report mismatch');
    }

    const invRep = await fetch(`${BASE_URL}/reports/invoices?dateFilter=this_month`, {
      headers: { Cookie: cookieA },
    });
    const invRepData = (await invRep.json()) as any;
    console.log('Invoice Report Paid Count:', invRepData.data.statusBreakdown.paid.count);
    if (invRepData.data.statusBreakdown.paid.count !== 1) throw new Error('Invoice report mismatch');

    console.log('\n====================================================');
    console.log('🎉 ALL MONEY MANAGEMENT & REPORT TESTS PASSED!');
    console.log('====================================================');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runMoneyTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});

