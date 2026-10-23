import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter } from '../../src/middleware/rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  it('allows requests within the configured quota and blocks on limit breach', () => {
    // Force NODE_ENV to non-test for this specific unit test
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 2
    });

    const mockReq = { ip: '127.0.0.1', socket: {} } as any;
    const headers: Record<string, any> = {};
    const mockRes = {
      setHeader: (k: string, v: any) => { headers[k] = v; },
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;

    const next = vi.fn();

    // Request 1: allowed
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Request 2: allowed
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(2);

    // Request 3: blocked with 429
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(2); // not called again
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Courtroom Adjourned: Rate Limit Exceeded'
      })
    );

    // Restore environment
    process.env.NODE_ENV = origEnv;
  });
});
