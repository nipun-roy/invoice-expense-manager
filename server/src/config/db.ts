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
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    if (env.MONGO_URI) {
      cached.promise = mongoose.connect(env.MONGO_URI, opts).then((m) => {
        console.log(`✅ MongoDB Connected: ${m.connection.host}`);
        return m;
      });
    } else {
      if (env.NODE_ENV === 'development') {
        console.log('Local MongoDB not detected on port 27017.');
        console.log('Starting embedded development database (mongodb-memory-server)...');
        cached.promise = (async () => {
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const memoryServer = await MongoMemoryServer.create({
            instance: { dbName: 'invoice_expense_manager' },
          });
          const uri = memoryServer.getUri();
          const conn = await mongoose.connect(uri);
          console.log(`✅ Embedded Development Database Connected: ${conn.connection.host}`);
          return conn;
        })();
      } else {
        console.warn('MONGO_URI not configured. Database connection skipped.');
        return;
      }
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection notice:', (error as Error).message);
    if (env.NODE_ENV === 'development') {
      console.log('Server continuing in offline-DB mode for baseline health checks.');
      return;
    }
    throw error;
  }

  return cached.conn;
};
