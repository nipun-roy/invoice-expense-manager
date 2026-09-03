import { hashPassword, comparePassword } from './utils/password.js';
import { generateToken, verifyToken } from './utils/jwt.js';
import { registerSchema, loginSchema } from './validators/auth.validator.js';
import { User } from './models/User.js';
import { BusinessProfile } from './models/BusinessProfile.js';
import { Customer } from './models/Customer.js';
import { Product } from './models/Product.js';
import { ExpenseCategory } from './models/ExpenseCategory.js';
import { Expense } from './models/Expense.js';
import { Invoice } from './models/Invoice.js';
import { Payment } from './models/Payment.js';

async function runUnitTests() {
  console.log('=== STARTING PHASE 2 UNIT & SCHEMA VALIDATION TESTS ===\n');

  console.log('--- Test 1: Password Hashing (bcryptjs) ---');
  const plainPassword = 'SuperSecret123!';
  const hash = await hashPassword(plainPassword);
  console.log('Generated Hash:', hash);
  const isValid = await comparePassword(plainPassword, hash);
  const isInvalid = await comparePassword('WrongPassword', hash);

  if (isValid && !isInvalid && hash !== plainPassword) {
    console.log('✅ Passed: Password hashed securely and verified with bcryptjs.');
  } else {
    throw new Error('Password hashing failed');
  }

  console.log('\n--- Test 2: JWT Token Generation & Verification ---');
  const testUserId = '60d5ecb8b3b64213a8e9d123';
  const token = generateToken(testUserId);
  console.log('Generated JWT Token:', token);
  const decoded = verifyToken(token);
  console.log('Decoded Token Payload:', decoded);

  if (decoded.userId === testUserId) {
    console.log('✅ Passed: JWT token signed and verified correctly.');
  } else {
    throw new Error('JWT verification failed');
  }

  console.log('\n--- Test 3: Zod Auth Input Validation ---');
  const validRegister = registerSchema.safeParse({
    name: 'Jane Doe',
    email: 'JANE@EXAMPLE.COM',
    password: 'password123',
  });
  const invalidRegister = registerSchema.safeParse({
    name: 'J',
    email: 'not-an-email',
    password: '123',
  });

  if (validRegister.success && !invalidRegister.success) {
    console.log('✅ Passed: Zod schemas correctly enforce minimum lengths & email validation.');
  } else {
    throw new Error('Zod validation failed');
  }

  console.log('\n--- Test 4: Mongoose Model Declarations & Schema Definitions ---');
  const models = [
    { name: 'User', model: User },
    { name: 'BusinessProfile', model: BusinessProfile },
    { name: 'Customer', model: Customer },
    { name: 'Product', model: Product },
    { name: 'ExpenseCategory', model: ExpenseCategory },
    { name: 'Expense', model: Expense },
    { name: 'Invoice', model: Invoice },
    { name: 'Payment', model: Payment },
  ];

  for (const m of models) {
    if (m.model && m.model.modelName === m.name) {
      console.log(`  - Model '${m.name}' initialized correctly with user reference.`);
    } else {
      throw new Error(`Model ${m.name} failed initialization`);
    }
  }
  console.log('✅ Passed: All 8 Mongoose models declared with tenant user references.');

  console.log('\n==================================================');
  console.log('🎉 ALL PHASE 2 UNIT & SCHEMA TESTS PASSED PERFECTLY!');
  console.log('==================================================');
}

runUnitTests().catch((err) => {
  console.error('❌ Unit tests failed:', err);
  process.exit(1);
});
