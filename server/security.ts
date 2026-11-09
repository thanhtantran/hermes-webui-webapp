import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
};

export const sameOriginCheck: RequestHandler = (req, res, next) => {
  const origin = req.get('origin');
  if (!origin) return next();

  try {
    const originHost = new URL(origin).host;
    if (originHost !== req.get('host')) {
      return res.status(403).json({ error: 'Cross-origin request rejected.' });
    }
  } catch {
    return res.status(403).json({ error: 'Invalid Origin header.' });
  }

  return next();
};

export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Try again in a minute.' },
});

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' },
});

export const secretLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many secret access attempts.' },
});
