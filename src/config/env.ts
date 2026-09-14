import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const here = path.dirname(fileURLToPath(import.meta.url));
// src/config -> backend root (works from both src/ and dist/)
const backendRoot = path.resolve(here, '..', '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const csv = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  );

const boolean = z
  .string()
  .default('false')
  .transform((value) => ['1', 'true', 'yes', 'on'].includes(value.toLowerCase()));

const integer = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      const parsed = Number.parseInt(value ?? '', 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: integer(4000),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:4000'),
  SITE_BASE_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  AUTH_JWT_SECRET: z.string().min(24, 'AUTH_JWT_SECRET must be at least 24 characters'),
  AUTH_SESSION_TTL_HOURS: integer(12),
  AUTH_COOKIE_NAME: z.string().default('mdb_admin_session'),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  AUTH_COOKIE_SAMESITE: z.enum(['none', 'lax', 'strict']).default('lax'),
  IP_HASH_SALT: z.string().min(8).default('miandubai-local-salt'),

  FRONTEND_ORIGIN: csv,
  ADMIN_ORIGIN: csv,

  MEDIA_STORAGE_DRIVER: z.enum(['filesystem']).default('filesystem'),
  MEDIA_ROOT: z.string().min(1, 'MEDIA_ROOT is required'),
  MEDIA_PUBLIC_URL: z.string().default(''),
  MEDIA_MAX_UPLOAD_BYTES: integer(10 * 1024 * 1024),

  FEATURE_NEWSLETTER: boolean,

  RATE_LIMIT_WINDOW_MS: integer(15 * 60 * 1000),
  RATE_LIMIT_MAX: integer(600),
  RATE_LIMIT_LOGIN_MAX: integer(10),
  RATE_LIMIT_CONTACT_MAX: integer(5),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid backend environment configuration:\n${details.join('\n')}`);
}

const raw = parsed.data;

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const env = {
  ...raw,
  PUBLIC_BASE_URL: stripTrailingSlash(raw.PUBLIC_BASE_URL),
  SITE_BASE_URL: stripTrailingSlash(raw.SITE_BASE_URL),
  MEDIA_PUBLIC_URL: stripTrailingSlash(raw.MEDIA_PUBLIC_URL),
  MEDIA_ROOT: path.resolve(raw.MEDIA_ROOT),
  backendRoot,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  /** Origins allowed to make credentialed requests. */
  allowedOrigins: [...new Set([...raw.FRONTEND_ORIGIN, ...raw.ADMIN_ORIGIN])],
  /** Media is served by this backend only when no external URL is configured. */
  servesMediaLocally: raw.MEDIA_PUBLIC_URL.trim() === '',
} as const;

export type Env = typeof env;
