import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { ZodError } from 'zod';
import { courtRouter } from './routes/court.routes.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { requestTimeout } from './middleware/timeout.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Apply production rate-limiting and request timeouts
  app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 30 }));
  app.use(requestTimeout(25000));

  // Serve static UI from public folder
  app.use(express.static(path.resolve(process.cwd(), 'public')));

  // Mount Courtroom endpoints
  app.use('/', courtRouter);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: err.flatten()
      });
      return;
    }

    console.error('[Unhandled Error]', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Courtroom Error'
    });
  });

  return app;
}
