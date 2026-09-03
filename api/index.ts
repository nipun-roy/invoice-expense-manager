import type { Request, Response } from 'express';
import app from '../server/src/server.js';
import { connectDB } from '../server/src/config/db.js';

export default async function handler(req: Request, res: Response) {
  // 1. Attempt MongoDB connection without crashing the Lambda process
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless DB initialization notice:', (err as Error).message);
  }

  // 2. Normalize path if Vercel serverless rewrite stripped the /api prefix
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  // 3. Delegate to Express app
  return app(req, res);
}

