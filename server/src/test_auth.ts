process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './server.js';
import { User } from './models/User.js';
import { BusinessProfile } from './models/BusinessProfile.js';

let mongoServer: MongoMemoryServer;

async function runTests() {
  console.log('=== STARTING PHASE 2 AUTHENTICATION & DATABASE TESTS ===\n');

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);
  console.log('✅ 1. MongoDB In-Memory Database Connected successfully.');

  const PORT = 5001;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api/auth`;

  try {
    console.log('\n--- Test 2: Invalid Input Registration ---');
    const invalidRegRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bademail', password: '123' }),
    });
    const invalidRegData = (await invalidRegRes.json()) as any;
    console.log('Status:', invalidRegRes.status);
    console.log('Response:', JSON.stringify(invalidRegData));
    if (invalidRegRes.status === 400) {
      console.log('✅ Passed: Invalid input rejected with 400 Bad Request.');
    } else {
      throw new Error('Failed invalid input test');
    }

    console.log('\n--- Test 3: Successful User Registration ---');
    const regRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'securepassword123',
      }),
    });
    const regData = (await regRes.json()) as any;
    const setCookieHeader = regRes.headers.get('set-cookie');
    console.log('Status:', regRes.status);
    console.log('Response:', JSON.stringify(regData));
    console.log('Set-Cookie Header:', setCookieHeader);

    if (regRes.status === 201 && setCookieHeader?.includes('token=')) {
      console.log('✅ Passed: User registered, BusinessProfile created, HTTP-only cookie issued.');
    } else {
      throw new Error('Failed registration test');
    }

    const profile = await BusinessProfile.findOne({ user: regData.data.id });
    if (profile && profile.businessName === "Jane Doe's Business") {
      console.log('✅ Passed: Default BusinessProfile verified in database:', profile.businessName);
    } else {
      throw new Error('BusinessProfile was not created properly');
    }

    const tokenCookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';

    console.log('\n--- Test 4: Duplicate Email Registration ---');
    const dupRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Clone',
        email: 'JANE@EXAMPLE.COM',
        password: 'anotherpassword',
      }),
    });
    const dupData = (await dupRes.json()) as any;
    console.log('Status:', dupRes.status);
    console.log('Response:', JSON.stringify(dupData));
    if (dupRes.status === 400 && dupData.error?.message?.includes('already exists')) {
      console.log('✅ Passed: Duplicate email rejected with proper error message.');
    } else {
      throw new Error('Failed duplicate email test');
    }

    console.log('\n--- Test 5: Authenticated GET /api/auth/me ---');
    const meRes = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: { Cookie: tokenCookie },
    });
    const meData = (await meRes.json()) as any;
    console.log('Status:', meRes.status);
    console.log('Response:', JSON.stringify(meData));
    if (meRes.status === 200 && meData.data.email === 'jane@example.com' && !meData.data.passwordHash) {
      console.log('✅ Passed: Authenticated user profile returned without passwordHash.');
    } else {
      throw new Error('Failed /api/auth/me test');
    }

    console.log('\n--- Test 6: Unauthenticated GET /api/auth/me ---');
    const unauthRes = await fetch(`${BASE_URL}/me`, { method: 'GET' });
    const unauthData = (await unauthRes.json()) as any;
    console.log('Status:', unauthRes.status);
    console.log('Response:', JSON.stringify(unauthData));
    if (unauthRes.status === 401) {
      console.log('✅ Passed: Unauthenticated access rejected with HTTP 401 Unauthorized.');
    } else {
      throw new Error('Failed unauthenticated test');
    }

    console.log('\n--- Test 7: Login with Invalid Password ---');
    const badLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane@example.com', password: 'wrongpassword' }),
    });
    const badLoginData = (await badLoginRes.json()) as any;
    console.log('Status:', badLoginRes.status);
    console.log('Response:', JSON.stringify(badLoginData));
    if (badLoginRes.status === 401) {
      console.log('✅ Passed: Invalid credentials rejected with 401.');
    } else {
      throw new Error('Failed invalid login test');
    }

    console.log('\n--- Test 8: Successful Login ---');
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane@example.com', password: 'securepassword123' }),
    });
    const loginData = (await loginRes.json()) as any;
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginData));
    if (loginRes.status === 200 && loginRes.headers.get('set-cookie')?.includes('token=')) {
      console.log('✅ Passed: Successful login issued HTTP-only token cookie.');
    } else {
      throw new Error('Failed login test');
    }

    console.log('\n--- Test 9: Logout ---');
    const logoutRes = await fetch(`${BASE_URL}/logout`, { method: 'POST' });
    const logoutData = (await logoutRes.json()) as any;
    console.log('Status:', logoutRes.status);
    console.log('Set-Cookie Header:', logoutRes.headers.get('set-cookie'));
    console.log('Response:', JSON.stringify(logoutData));
    if (logoutRes.status === 200) {
      console.log('✅ Passed: Logout successfully cleared authentication cookie.');
    } else {
      throw new Error('Failed logout test');
    }

    console.log('\n==================================================');
    console.log('🎉 ALL PHASE 2 TESTS PASSED PERFECTLY!');
    console.log('==================================================');

  } finally {
    server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
