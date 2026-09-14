import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env.js';

export const CSRF_COOKIE_NAME = 'mdb_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export interface SessionClaims {
  sub: number;
  email: string;
  role: string;
  /** Matches AdminUser.tokenVersion; a bump invalidates every issued cookie. */
  tv: number;
}

const ttlSeconds = () => env.AUTH_SESSION_TTL_HOURS * 60 * 60;

export const signSessionToken = (claims: SessionClaims): string =>
  jwt.sign(claims, env.AUTH_JWT_SECRET, {
    expiresIn: ttlSeconds(),
    issuer: 'miandubai',
    audience: 'miandubai-admin',
  });

export const verifySessionToken = (token: string): SessionClaims | null => {
  try {
    const payload = jwt.verify(token, env.AUTH_JWT_SECRET, {
      issuer: 'miandubai',
      audience: 'miandubai-admin',
    });
    if (typeof payload === 'string') return null;
    const { sub, email, role, tv } = payload as Record<string, unknown>;
    if (typeof sub !== 'number' || typeof email !== 'string' || typeof role !== 'string' || typeof tv !== 'number') {
      return null;
    }
    return { sub, email, role, tv };
  } catch {
    return null;
  }
};

const baseCookieOptions = (): CookieOptions => {
  // SameSite=None requires Secure; browsers drop the cookie otherwise.
  const sameSite = env.AUTH_COOKIE_SAMESITE;
  return {
    httpOnly: true,
    secure: env.isProduction || sameSite === 'none',
    sameSite,
    path: '/',
    ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
  };
};

export const issueSessionCookies = (res: Response, token: string): string => {
  const csrfToken = crypto.randomBytes(32).toString('base64url');
  const maxAge = ttlSeconds() * 1000;

  res.cookie(env.AUTH_COOKIE_NAME, token, { ...baseCookieOptions(), maxAge });
  // Readable by the admin app so it can echo the value back in a header.
  res.cookie(CSRF_COOKIE_NAME, csrfToken, { ...baseCookieOptions(), httpOnly: false, maxAge });

  return csrfToken;
};

export const clearSessionCookies = (res: Response) => {
  const options = baseCookieOptions();
  res.clearCookie(env.AUTH_COOKIE_NAME, options);
  res.clearCookie(CSRF_COOKIE_NAME, { ...options, httpOnly: false });
};
