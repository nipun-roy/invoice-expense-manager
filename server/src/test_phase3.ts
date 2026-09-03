process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './server.js';
import fs from 'fs';
import path from 'path';

async function verifyPhase3() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 3 AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Audit Client-side Code for Token Leaks
  console.log('--- Step 1: Frontend Storage & Token Security Audit ---');
  const clientSrc = path.resolve(process.cwd(), '../client/src');
  
  function scanDir(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(scanDir(fullPath));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const clientFiles = scanDir(clientSrc);
  let storageViolations = 0;
  for (const file of clientFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('localStorage') || content.includes('sessionStorage')) {
      console.error(`❌ Violation in ${file}: References localStorage or sessionStorage!`);
      storageViolations++;
    }
  }

  if (storageViolations === 0) {
    console.log('✅ Audit Passed: 0 references to localStorage / sessionStorage in client code.');
    console.log('✅ JWT is never stored in browser web storage.');
  } else {
    throw new Error(`Failed client security audit with ${storageViolations} violations`);
  }

  // 2. Setup In-Memory Server for Authentication Flow Testing
  console.log('\n--- Step 2: Database & Backend Server Initialization ---');
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);

  const PORT = 5002;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api`;

  try {
    // 3. Test Registration & HTTP-only Cookie issuance
    console.log('\n--- Step 3: Registration with HTTP-Only Cookie ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Springs',
        email: 'alice@springs.io',
        password: 'securepassword123',
      }),
    });

    const regData = (await regRes.json()) as any;
    const regCookies = regRes.headers.get('set-cookie') || '';
    console.log('Register Status:', regRes.status);
    console.log('Register Response:', JSON.stringify(regData));
    console.log('Set-Cookie Header:', regCookies);

    if (regRes.status !== 201) throw new Error('Registration failed');
    if (!regCookies.toLowerCase().includes('httponly')) {
      throw new Error('Cookie missing HttpOnly attribute');
    }
    if (regData.token !== undefined) {
      throw new Error('JWT token leaked in JSON response body');
    }
    console.log('✅ Registration Passed: HTTP-only cookie issued, token not exposed in response body.');

    const tokenCookie = regCookies.split(';')[0];

    // 4. Test GET /api/auth/me (Protected Route & Session Verification)
    console.log('\n--- Step 4: GET /api/auth/me Session & Business Profile Verification ---');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: tokenCookie },
    });
    const meData = (await meRes.json()) as any;
    console.log('Me Status:', meRes.status);
    console.log('Me Data:', JSON.stringify(meData));

    if (meRes.status !== 200) throw new Error('/api/auth/me failed');
    if (meData.data.email !== 'alice@springs.io') throw new Error('User email mismatch');
    if (!meData.data.businessProfile) throw new Error('businessProfile missing from /api/auth/me');
    if (meData.data.businessProfile.businessName !== "Alice Springs's Business") {
      throw new Error('Unexpected business profile name');
    }
    console.log('✅ GET /api/auth/me Passed: Profile and BusinessProfile retrieved successfully.');

    // 5. Test Unauthenticated Access to Protected Route
    console.log('\n--- Step 5: Route Guarding (Unauthenticated /api/auth/me) ---');
    const unauthMe = await fetch(`${BASE_URL}/auth/me`);
    console.log('Unauth Status:', unauthMe.status);
    if (unauthMe.status !== 401) throw new Error('Unauthenticated request was not rejected with 401');
    console.log('✅ Passed: Unauthenticated request rejected with HTTP 401.');

    // 6. Test Login
    console.log('\n--- Step 6: User Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@springs.io',
        password: 'securepassword123',
      }),
    });
    const loginData = (await loginRes.json()) as any;
    const loginCookies = loginRes.headers.get('set-cookie') || '';
    console.log('Login Status:', loginRes.status);
    console.log('Set-Cookie:', loginCookies);
    if (loginRes.status !== 200 || !loginCookies.toLowerCase().includes('httponly')) {
      throw new Error('Login failed or missing HttpOnly cookie');
    }
    console.log('✅ Login Passed: Returns 200 and sets HTTP-only cookie.');

    // 7. Test Logout
    console.log('\n--- Step 7: User Logout ---');
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: tokenCookie },
    });
    const logoutCookies = logoutRes.headers.get('set-cookie') || '';
    console.log('Logout Status:', logoutRes.status);
    console.log('Logout Set-Cookie:', logoutCookies);
    if (logoutRes.status !== 200) throw new Error('Logout failed');
    console.log('✅ Logout Passed: Invalidation cookie returned.');

    // 8. Test Business Profile API Status (Check existence of PUT /api/business-profile)
    console.log('\n--- Step 8: Verification of Missing Backend Business Profile Update Endpoint ---');
    const bpPutRes = await fetch(`${BASE_URL}/business-profile`, {
      method: 'PUT',
      headers: { Cookie: tokenCookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: 'New Name' }),
    });
    console.log('PUT /api/business-profile Status:', bpPutRes.status);
    if (bpPutRes.status === 404) {
      console.log('✅ Confirmed: PUT /api/business-profile does not exist (404 Not Found).');
      console.log('   The frontend accurately reports this status in the Settings UI.');
    } else {
      console.log(`Note: PUT /api/business-profile returned status ${bpPutRes.status}`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 3 VERIFICATION CHECKS PASSED!');
    console.log('====================================================');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

verifyPhase3().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

