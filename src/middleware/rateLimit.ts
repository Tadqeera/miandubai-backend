// Named import: type checkers that resolve the package's CommonJS declarations for this
// ES module (Vercel's build) treat the default import as the non-callable module object.
import { rateLimit, type Options } from 'express-rate-limit';
import { env } from '../config/env.js';

const shared: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Rate limits are a nuisance in automated tests; the values stay real in dev.
  skip: () => env.isTest,
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please wait a moment and try again.' },
    });
  },
};

export const apiLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

/** Login is limited per IP + submitted email so one account cannot be drained. */
export const loginLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_LOGIN_MAX,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
    return `${req.ip ?? 'unknown'}|${email}`;
  },
});

export const contactLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_CONTACT_MAX,
});

/**
 * Analytics beacons are fired from click handlers, so the ceiling is higher
 * than the contact form's — but it is still bounded per IP so the table cannot
 * be flooded from a single source.
 */
export const eventLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 30,
});

export const uploadLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 40,
});
