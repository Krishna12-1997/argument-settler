import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(
  options: {
    windowMs?: number;
    maxRequests?: number;
  } = {},
) {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const maxRequests = options.maxRequests ?? 30;
  const ipStore = new Map<string, RateLimitRecord>();

  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, record] of ipStore.entries()) {
        if (now > record.resetTime) {
          ipStore.delete(ip);
        }
      }
    },
    5 * 60 * 1000,
  ).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const record = ipStore.get(ip);

    if (!record || now > record.resetTime) {
      ipStore.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      return next();
    }

    record.count++;
    const remaining = Math.max(0, maxRequests - record.count);
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        success: false,
        error: "Courtroom Adjourned: Rate Limit Exceeded",
        message:
          "Arre bhaisahab! You have filed too many petty grievances in 15 minutes. The bench is taking a mandatory chai break. Reflect on your life and return in a few minutes!",
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    next();
  };
}
