import type { NextFunction, Request, RequestHandler, Response } from 'express';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

/** Wraps an async route so rejected promises reach the error middleware. */
export const asyncHandler =
  <T extends RequestHandler>(handler: T): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };

/** Hashed client IP — we never persist raw addresses. */
export const hashIp = (req: Request): string =>
  crypto
    .createHmac('sha256', env.IP_HASH_SALT)
    .update(req.ip ?? 'unknown')
    .digest('hex')
    .slice(0, 64);

export const clientOrigin = (req: Request): string | undefined => req.get('origin') ?? undefined;
