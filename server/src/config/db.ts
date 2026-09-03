import mongoose from 'mongoose';
import { env } from './env.js';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export const connectDB = async (): Promise<typeof mongoose | void> => {
  // Return cached active connection immediately
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const uri = env.MONGO_URI || process.env.MONGO_URI || process.env.MONGODB_URI;

      if (!uri) {
        throw new Error(
          'Database connection failed: MONGO_URI (or MONGODB_URI) is not configured. Please add your MongoDB Atlas connection string to environment variables.'
        );
      }

      // 1. In production or on Vercel, connect directly to MongoDB Atlas
      const isProductionOrRemote =
        Boolean(process.env.VERCEL) ||
        process.env.NODE_ENV === 'production' ||
        (!uri.includes('localhost') && !uri.includes('127.0.0.1'));

      if (isProductionOrRemote) {
        try {
          const conn = await mongoose.connect(uri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
          });
          console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
          return conn;
        } catch (err) {
          const msg = (err as Error).message;
          console.error('Remote MongoDB connection error:', msg);
          throw new Error(
            `Database connection failed: ${msg}. Please verify your MongoDB Atlas connection string (MONGO_URI) in Vercel Environment Variables and ensure Network Access (0.0.0.0/0) is allowed.`
          );
        }
      }

      // 2. In local development, try local MongoDB first
      try {
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 1500,
        });
        console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (err) {
        console.log('Local MongoDB not detected on port 27017.');
      }

      // 3. Local dev fallback: try embedded development database if installed
      try {
        // Use runtime dynamic resolution so TypeScript does not require the package at build time
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        const { MongoMemoryServer } = await dynamicImport('mongodb-memory-server');
        const memoryServer = await MongoMemoryServer.create({
          instance: { dbName: 'invoice_expense_manager' },
        });
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`✅ Embedded Development Database Connected: ${conn.connection.host}`);
        return conn;
      } catch {
        console.warn('⚠️ Could not connect to local MongoDB. Please configure MONGO_URI or run a local MongoDB instance.');
        throw new Error('Local MongoDB connection failed. Please provide a valid MONGO_URI or start local MongoDB.');
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection notice:', (error as Error).message);
    throw error;
  }
};
