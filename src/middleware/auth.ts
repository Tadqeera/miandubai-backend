import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AdminRole } from '@prisma/client';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, csrfTokensMatch, verifySessionToken } from '../modules/auth/tokens.js';

export interface AuthenticatedAdmin {
  id: number;
  email: string;
  displayName: string;
  role: AdminRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
    }
  }
}

export const requireAdmin: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[env.AUTH_COOKIE_NAME];
  if (typeof token !== 'string' || token.length === 0) {
    next(ApiError.unauthorized());
    return;
  }

  const claims = verifySessionToken(token);
  if (!claims) {
    next(ApiError.unauthorized('Your session has expired. Please sign in again.'));
    return;
  }

  prisma.adminUser
    .findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, displayName: true, role: true, isActive: true, tokenVersion: true },
    })
    .then((admin) => {
      if (!admin || !admin.isActive || admin.tokenVersion !== claims.tv) {
        next(ApiError.unauthorized('Your session is no longer valid. Please sign in again.'));
        return;
      }
      req.admin = { id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role };
      next();
    })
    .catch(next);
};

export const requireRole =
  (...roles: AdminRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.admin) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.admin.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF guard for the cookie-authenticated admin API. The token
 * lives in a cookie and must be echoed back in a header, which a cross-site
 * page cannot do. The admin app obtains the value from `/auth/login`,
 * `/auth/me` or `/auth/csrf` (see `ensureCsrfToken`).
 */
export const csrfGuard: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (typeof cookieToken !== 'string' || typeof headerToken !== 'string' || cookieToken.length === 0) {
    next(ApiError.csrf('Missing CSRF token.'));
    return;
  }
  if (!csrfTokensMatch(cookieToken, headerToken)) {
    next(ApiError.csrf('Invalid CSRF token.'));
    return;
  }
  next();
};
