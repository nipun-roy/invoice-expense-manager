import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import businessProfileRoutes from './routes/businessProfile.routes.js';
import customerRoutes from './routes/customer.routes.js';
import productRoutes from './routes/product.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import expenseCategoryRoutes from './routes/expenseCategory.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

// Middlewares
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile, curl, same-origin/proxied requests)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ensure MongoDB connection is established before API routes are processed
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Invoice & Expense Manager API is healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/business-profile', businessProfileRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use(errorHandler);

export const startServer = (port: number | string = env.PORT) => {
  const server = app.listen(port, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use. Retrying in 1.5 seconds...`);
      setTimeout(() => {
        server.close();
        server.listen(port);
      }, 1500);
    } else {
      console.error('Server network error:', err);
    }
  });

  process.once('SIGINT', () => {
    server.close();
  });
  process.once('SIGTERM', () => {
    server.close();
  });

  connectDB();
  return server;
};

// Execute if run directly via CLI (not in Vercel or when imported as serverless module)
const isDirectExecution =
  !process.env.VERCEL &&
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js') ||
    process.argv[1].includes('tsx'));

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
