import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { ZodError } from 'zod';
import { courtRouter } from './routes/court.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

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
