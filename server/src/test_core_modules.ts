process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './server.js';

async function runCoreTests() {
  console.log('====================================================');
  console.log('🚀 TESTING CORE BUSINESS MODULES & SECURITY');
  console.log('====================================================\n');

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);

  const PORT = 5003;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api`;

  try {
    // 1. Create User A & User B
    console.log('--- Step 1: Register User A and User B ---');
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: 'usera@example.com', password: 'password123' }),
    });
    const cookieA = regResA.headers.get('set-cookie')?.split(';')[0] || '';

    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: 'userb@example.com', password: 'password123' }),
    });
    const cookieB = regResB.headers.get('set-cookie')?.split(';')[0] || '';

    console.log('✅ Registered User A and User B with distinct cookies.');

    // 2. Business Profile Backend Tests
    console.log('\n--- Step 2: Business Profile Backend ---');
    const bpGet = await fetch(`${BASE_URL}/business-profile`, { headers: { Cookie: cookieA } });
    const bpGetData = (await bpGet.json()) as any;
    console.log('GET /api/business-profile Status:', bpGet.status);
    if (bpGet.status !== 200 || !bpGetData.data.businessName) throw new Error('GET /api/business-profile failed');

    const bpPut = await fetch(`${BASE_URL}/business-profile`, {
      method: 'PUT',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Acme Apex Corp',
        invoicePrefix: 'APEX-',
        defaultCurrency: 'EUR',
        taxVatNumber: 'VAT-998877',
      }),
    });
    const bpPutData = (await bpPut.json()) as any;
    console.log('PUT /api/business-profile Status:', bpPut.status);
    if (bpPut.status !== 200 || bpPutData.data.invoicePrefix !== 'APEX-') throw new Error('PUT /api/business-profile failed');
    console.log('✅ Business Profile retrieved and updated successfully.');

    // 3. Customer Management Tests
    console.log('\n--- Step 3: Customer Management CRUD ---');
    const custRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Global Tech Inc',
        email: 'billing@globaltech.com',
        phone: '+1-555-1234',
        address: '100 Innovation Way',
      }),
    });
    const custData = (await custRes.json()) as any;
    console.log('Create Customer Status:', custRes.status);
    if (custRes.status !== 201 || !custData.data._id) throw new Error('Create customer failed');
    const customerIdA = custData.data._id;

    // Search customers
    const custList = await fetch(`${BASE_URL}/customers?search=Global`, { headers: { Cookie: cookieA } });
    const custListData = (await custList.json()) as any;
    if (custList.status !== 200 || custListData.data.length !== 1) throw new Error('Customer search failed');
    console.log('✅ Customer created and verified via search query.');

    // 4. Product Management Tests
    console.log('\n--- Step 4: Product / Service Management CRUD ---');
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cloud Consulting',
        price: 150,
        unit: 'hour',
        taxRate: 10,
        isActive: true,
      }),
    });
    const prodData = (await prodRes.json()) as any;
    console.log('Create Product Status:', prodRes.status);
    if (prodRes.status !== 201 || !prodData.data._id) throw new Error('Create product failed');
    const productIdA = prodData.data._id;
    console.log('✅ Product created with pricing and tax configuration.');

    // 5. Invoice Management & Calculation Safety Tests
    console.log('\n--- Step 5: Invoice Creation & Calculation Safety ---');
    // We send line items: 10 hours @ $150 (subtotal = 1500), 10% tax (tax = 150), discount = $50
    // Expected grandTotal = 1500 - 50 + 150 = 1600.
    const invRes = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: customerIdA,
        status: 'DRAFT',
        items: [
          {
            product: productIdA,
            description: '10 Hours of Cloud Consulting',
            quantity: 10,
            unitPrice: 150,
            taxRate: 10,
          },
        ],
        discount: 50,
        notes: 'Net 14 payment terms.',
      }),
    });
    const invData = (await invRes.json()) as any;
    console.log('Create Invoice Status:', invRes.status);
    console.log('Generated Invoice Number:', invData.data?.invoiceNumber);
    console.log('Calculated Subtotal:', invData.data?.subtotal);
    console.log('Calculated Tax Total:', invData.data?.taxTotal);
    console.log('Calculated Grand Total:', invData.data?.grandTotal);
    console.log('Calculated Amount Due:', invData.data?.amountDue);

    if (
      invRes.status !== 201 ||
      invData.data.subtotal !== 1500 ||
      invData.data.taxTotal !== 150 ||
      invData.data.discount !== 50 ||
      invData.data.grandTotal !== 1600 ||
      invData.data.amountDue !== 1600
    ) {
      throw new Error('Invoice calculation mismatch!');
    }
    const invoiceIdA = invData.data._id;
    console.log('✅ Server calculation verified: 100% accurate mathematical computation.');

    // 6. Duplicate Invoice Test
    console.log('\n--- Step 6: Duplicate Invoice ---');
    const dupRes = await fetch(`${BASE_URL}/invoices/${invoiceIdA}/duplicate`, {
      method: 'POST',
      headers: { Cookie: cookieA },
    });
    const dupData = (await dupRes.json()) as any;
    console.log('Duplicate Status:', dupRes.status);
    console.log('Duplicated Invoice Number:', dupData.data?.invoiceNumber);
    if (dupRes.status !== 201 || dupData.data.invoiceNumber === invData.data.invoiceNumber) {
      throw new Error('Duplicate invoice failed or used same invoice number');
    }
    console.log('✅ Invoice duplicated with unique sequential number.');

    // 7. Mark as Paid Test
    console.log('\n--- Step 7: Mark Invoice as Paid ---');
    const payRes = await fetch(`${BASE_URL}/invoices/${invoiceIdA}/mark-paid`, {
      method: 'PATCH',
      headers: { Cookie: cookieA },
    });
    const payData = (await payRes.json()) as any;
    console.log('Mark Paid Status:', payRes.status);
    if (payRes.status !== 200 || payData.data.status !== 'PAID' || payData.data.amountDue !== 0) {
      throw new Error('Mark as paid failed');
    }
    console.log('✅ Invoice marked as PAID; amountDue set to 0.');

    // 8. Attempt to Modify Paid Invoice (Draft Protection)
    console.log('\n--- Step 8: Draft Protection on Non-Draft Invoice ---');
    const editPaidRes = await fetch(`${BASE_URL}/invoices/${invoiceIdA}`, {
      method: 'PUT',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Try editing paid invoice' }),
    });
    console.log('Edit Paid Status:', editPaidRes.status);
    if (editPaidRes.status === 400) {
      console.log('✅ Passed: Modification rejected on non-draft invoice.');
    } else {
      throw new Error('Failed draft protection test');
    }

    // 9. Cross-User IDOR Prevention Test
    console.log('\n--- Step 9: IDOR / Cross-User Access Prevention ---');
    const idorCust = await fetch(`${BASE_URL}/customers/${customerIdA}`, {
      headers: { Cookie: cookieB },
    });
    console.log('User B access to User A customer:', idorCust.status);

    const idorInv = await fetch(`${BASE_URL}/invoices/${invoiceIdA}`, {
      headers: { Cookie: cookieB },
    });
    console.log('User B access to User A invoice:', idorInv.status);

    if (idorCust.status !== 404 || idorInv.status !== 404) {
      throw new Error('IDOR vulnerability detected!');
    }
    console.log('✅ Passed: Cross-user access securely rejected with 404.');

    // 10. PDF Generation Test
    console.log('\n--- Step 10: Invoice PDF Generation ---');
    const pdfRes = await fetch(`${BASE_URL}/invoices/${invoiceIdA}/pdf`, {
      headers: { Cookie: cookieA },
    });
    const contentType = pdfRes.headers.get('content-type');
    const pdfBuffer = await pdfRes.arrayBuffer();
    console.log('PDF Status:', pdfRes.status);
    console.log('PDF Content-Type:', contentType);
    console.log('PDF Byte Length:', pdfBuffer.byteLength);

    if (pdfRes.status !== 200 || !contentType?.includes('application/pdf') || pdfBuffer.byteLength < 500) {
      throw new Error('PDF generation failed or returned invalid buffer');
    }
    console.log('✅ Passed: Professional PDF generated and streamed successfully.');

    console.log('\n====================================================');
    console.log('🎉 ALL CORE BACKEND MODULE TESTS PASSED PERFECTLY!');
    console.log('====================================================');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runCoreTests().catch((err) => {
  console.error('❌ Core test suite error:', err);
  process.exit(1);
});

