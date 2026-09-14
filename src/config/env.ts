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

/** Blank values (`KEY=` in a .env file) count as missing. */
const optionalValue = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const CLOUDINARY_VARIABLES = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const;

const schema = z
  .object({
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

    MEDIA_STORAGE_DRIVER: z.enum(['filesystem', 'cloudinary']).default('filesystem'),
    /** Required only by the filesystem driver. */
    MEDIA_ROOT: optionalValue,
    MEDIA_PUBLIC_URL: z.string().default(''),
    MEDIA_MAX_UPLOAD_BYTES: integer(10 * 1024 * 1024),

    /** Required only by the cloudinary driver. */
    CLOUDINARY_CLOUD_NAME: optionalValue,
    CLOUDINARY_API_KEY: optionalValue,
    CLOUDINARY_API_SECRET: optionalValue,

    FEATURE_NEWSLETTER: boolean,

    RATE_LIMIT_WINDOW_MS: integer(15 * 60 * 1000),
    RATE_LIMIT_MAX: integer(600),
    RATE_LIMIT_LOGIN_MAX: integer(10),
    RATE_LIMIT_CONTACT_MAX: integer(5),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  })
  .superRefine((value, ctx) => {
    // Driver-specific requirements. Messages name the variable, never its value.
    if (value.MEDIA_STORAGE_DRIVER === 'filesystem' && !value.MEDIA_ROOT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MEDIA_ROOT'],
        message: 'MEDIA_ROOT is required when MEDIA_STORAGE_DRIVER=filesystem',
      });
    }
    if (value.MEDIA_STORAGE_DRIVER === 'cloudinary') {
      for (const name of CLOUDINARY_VARIABLES) {
        if (!value[name]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [name],
            message: `${name} is required when MEDIA_STORAGE_DRIVER=cloudinary`,
          });
        }
      }
    }
  });

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

/**
 * Validates an environment source. Exported so the driver-specific rules can be
 * tested without touching process.env or the local .env file.
 */
export const parseEnvironment = (source: NodeJS.ProcessEnv) => {
  const parsed = schema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid backend environment configuration:\n${details.join('\n')}`);
  }

  const raw = parsed.data;
  const mediaPublicUrl = stripTrailingSlash(raw.MEDIA_PUBLIC_URL);
  /** Media is served by this backend only for the filesystem driver with no external URL configured. */
  const servesMediaLocally = raw.MEDIA_STORAGE_DRIVER === 'filesystem' && mediaPublicUrl.trim() === '';

  return {
    ...raw,
    PUBLIC_BASE_URL: stripTrailingSlash(raw.PUBLIC_BASE_URL),
    SITE_BASE_URL: stripTrailingSlash(raw.SITE_BASE_URL),
    MEDIA_PUBLIC_URL: mediaPublicUrl,
    /** Absolute path for the filesystem driver; empty when cloudinary is used without one. */
    MEDIA_ROOT: raw.MEDIA_ROOT ? path.resolve(raw.MEDIA_ROOT) : '',
    backendRoot,
    isProduction: raw.NODE_ENV === 'production',
    isTest: raw.NODE_ENV === 'test',
    /** Origins allowed to make credentialed requests. */
    allowedOrigins: [...new Set([...raw.FRONTEND_ORIGIN, ...raw.ADMIN_ORIGIN])],
    servesMediaLocally,
    /** Where media is delivered from (logs / dashboard only — never a credential). */
    mediaServedBy:
      raw.MEDIA_STORAGE_DRIVER === 'cloudinary' ? 'cloudinary' : servesMediaLocally ? 'backend' : mediaPublicUrl,
  } as const;
};

export const env = parseEnvironment(process.env);

export type Env = typeof env;
