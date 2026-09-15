import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env.js';

export const CSRF_COOKIE_NAME = 'mdb_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** 32 random bytes, base64url-encoded without padding. */
const CSRF_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const newCsrfToken = () => crypto.randomBytes(32).toString('base64url');

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

const setCsrfCookie = (res: Response, csrfToken: string) => {
  res.cookie(CSRF_COOKIE_NAME, csrfToken, { ...baseCookieOptions(), httpOnly: false, maxAge: ttlSeconds() * 1000 });
};

export const issueSessionCookies = (res: Response, token: string): string => {
  const csrfToken = newCsrfToken();

  res.cookie(env.AUTH_COOKIE_NAME, token, { ...baseCookieOptions(), maxAge: ttlSeconds() * 1000 });
  setCsrfCookie(res, csrfToken);

  return csrfToken;
};

/**
 * The CSRF token for an authenticated request, re-issuing the cookie when it is
 * missing or malformed.
 *
 * The admin app runs on its own origin (admin.miandubai.com) and cannot read a
 * cookie the API origin set (api.miandubai.com) through `document.cookie`, so
 * the token is handed over in the body of a credentialed response instead. CORS
 * only lets allow-listed origins read that body; a cross-site page can neither
 * read the token nor set the cookie, so the double-submit check still holds.
 */
export const ensureCsrfToken = (req: Request, res: Response): string => {
  const current = req.cookies?.[CSRF_COOKIE_NAME];
  if (typeof current === 'string' && CSRF_TOKEN_PATTERN.test(current)) return current;

  const csrfToken = newCsrfToken();
  setCsrfCookie(res, csrfToken);
  return csrfToken;
};

/** Constant-time comparison, so a guess cannot be refined from response timing. */
export const csrfTokensMatch = (cookieToken: string, headerToken: string): boolean => {
  const expected = Buffer.from(cookieToken);
  const received = Buffer.from(headerToken);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export const clearSessionCookies = (res: Response) => {
  const options = baseCookieOptions();
  res.clearCookie(env.AUTH_COOKIE_NAME, options);
  res.clearCookie(CSRF_COOKIE_NAME, { ...options, httpOnly: false });
};
