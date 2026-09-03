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
      // 1. If MONGO_URI is provided and not default local, or if on Vercel, try it directly
      if (env.MONGO_URI && (process.env.VERCEL || !env.MONGO_URI.includes('localhost'))) {
        try {
          const conn = await mongoose.connect(env.MONGO_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
          });
          console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
          return conn;
        } catch (err) {
          console.error('Remote MongoDB connection error:', (err as Error).message);
          if (process.env.VERCEL) throw err;
        }
      }

      // 2. In local development, try local MongoDB first; if refused, boot embedded MongoMemoryServer
      if (env.NODE_ENV === 'development') {
        try {
          const conn = await mongoose.connect(env.MONGO_URI || 'mongodb://127.0.0.1:27017/invoice_expense_manager', {
            serverSelectionTimeoutMS: 1500,
          });
          console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
          return conn;
        } catch (err) {
          console.log('Local MongoDB not detected on port 27017.');
          console.log('Starting embedded development database (mongodb-memory-server)...');
        }

        try {
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const memoryServer = await MongoMemoryServer.create({
            instance: { dbName: 'invoice_expense_manager' },
          });
          const uri = memoryServer.getUri();
          const conn = await mongoose.connect(uri);
          console.log(`✅ Embedded Development Database Connected: ${conn.connection.host}`);
          return conn;
        } catch (memErr) {
          console.error('Failed to initialize embedded database:', memErr);
          throw memErr;
        }
      }

      throw new Error('No MongoDB connection available');
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
