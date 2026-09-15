import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } });
};

/**
 * Prisma codes meaning the database could not be reached or did not answer in
 * time, including an expired transaction (P2028) and a deadlock (P2034). The
 * request can simply be tried again.
 */
const DATABASE_UNAVAILABLE = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028', 'P2034']);

interface PrismaFailure {
  code: string;
  meta?: Record<string, unknown>;
}

/**
 * The code of a Prisma client error. Recognised by shape as well as by class,
 * so a second copy of the client in a bundle cannot turn a known database
 * condition into an unexplained 500.
 */
const prismaFailure = (error: unknown): PrismaFailure | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return { code: error.code, meta: error.meta };
  if (error instanceof Prisma.PrismaClientInitializationError) return { code: error.errorCode ?? 'P1001' };
  if (typeof error !== 'object' || error === null || !('clientVersion' in error)) return null;

  const { code, errorCode, meta } = error as { code?: unknown; errorCode?: unknown; meta?: unknown };
  const candidate = typeof code === 'string' ? code : typeof errorCode === 'string' ? errorCode : null;
  if (!candidate || !/^P\d{4}$/.test(candidate)) return null;
  return { code: candidate, meta: typeof meta === 'object' && meta !== null ? (meta as Record<string, unknown>) : undefined };
};

/** Unique-constraint targets arrive as column lists or index names such as `products_sku_key`. */
const UNIQUE_FIELD_LABELS: Array<[RegExp, string]> = [
  [/sku/i, 'SKU'],
  [/slug/i, 'URL slug'],
  [/email/i, 'email address'],
  [/storage_?key/i, 'file'],
];

const fromPrisma = ({ code, meta }: PrismaFailure): ApiError | null => {
  if (DATABASE_UNAVAILABLE.has(code)) {
    return new ApiError('SERVICE_UNAVAILABLE', 'The database did not respond in time. Please try again in a moment.');
  }
  if (code === 'P2002') {
    const target = meta?.target;
    const raw = Array.isArray(target) ? target.join(', ') : typeof target === 'string' ? target : '';
    const label = UNIQUE_FIELD_LABELS.find(([pattern]) => pattern.test(raw))?.[1] ?? 'value';
    return ApiError.conflict(`A record with that ${label} already exists.`);
  }
  if (code === 'P2000') {
    const column = typeof meta?.column_name === 'string' ? meta.column_name : undefined;
    return ApiError.validation(
      'A value is longer than this field allows.',
      column ? [{ field: column, message: 'This value is too long.' }] : undefined,
    );
  }
  if (code === 'P2025') {
    return ApiError.notFound('Record not found.');
  }
  if (code === 'P2003') {
    return ApiError.conflict('This record is referenced elsewhere and cannot be changed.');
  }
  return null;
};

const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return ApiError.validation(
      'The submitted data is not valid.',
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return ApiError.tooLarge('The uploaded file is larger than the configured limit.');
    }
    return ApiError.badRequest(`Upload rejected: ${error.code}.`);
  }

  const failure = prismaFailure(error);
  const mapped = failure ? fromPrisma(failure) : null;
  if (mapped) return mapped;

  return new ApiError('INTERNAL_ERROR', 'Something went wrong. Please try again.');
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const apiError = toApiError(error);

  if (apiError.status >= 500) {
    logger.error(
      { err: error, code: apiError.code, prismaCode: prismaFailure(error)?.code, path: req.path, method: req.method },
      'Unhandled request error',
    );
  } else {
    logger.debug({ code: apiError.code, path: req.path, method: req.method }, apiError.message);
  }

  const body: Record<string, unknown> = {
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  };

  // Stack traces are development-only; production responses stay generic.
  if (!env.isProduction && apiError.status >= 500 && error instanceof Error) {
    (body.error as Record<string, unknown>).debug = { name: error.name, message: error.message, stack: error.stack };
  }

  res.status(apiError.status).json(body);
};
