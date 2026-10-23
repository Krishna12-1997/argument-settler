import { Request, Response, NextFunction } from 'express';

export function requestTimeout(timeoutMs: number = 25000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Disable timeout during automated test runs
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: 'Courtroom Timeout',
          message: 'Order in the court! The digital stenographer took longer than expected. Please re-submit your plea to Justice Bhide.'
        });
      }
    }, timeoutMs);

    // Clear timeout when response completes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}
