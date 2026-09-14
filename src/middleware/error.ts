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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[] | string | undefined) ?? 'field';
      const fields = Array.isArray(target) ? target.join(', ') : String(target);
      return ApiError.conflict(`A record with that ${fields} already exists.`);
    }
    if (error.code === 'P2025') {
      return ApiError.notFound('Record not found.');
    }
    if (error.code === 'P2003') {
      return ApiError.conflict('This record is referenced elsewhere and cannot be changed.');
    }
  }

  return new ApiError('INTERNAL_ERROR', 'Something went wrong. Please try again.');
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const apiError = toApiError(error);

  if (apiError.status >= 500) {
    logger.error({ err: error, path: req.path, method: req.method }, 'Unhandled request error');
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
