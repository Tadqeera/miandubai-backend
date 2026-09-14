import type { RequestHandler } from 'express';
import type { ZodTypeAny, ZodError, z } from 'zod';
import { ApiError } from '../lib/errors.js';

const formatIssues = (error: ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

type Source = 'body' | 'query' | 'params';

/**
 * Replaces the request slice with the parsed result, so handlers always work
 * with validated, coerced data instead of raw input.
 */
export const validate =
  <T extends ZodTypeAny>(schema: T, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(ApiError.validation('The submitted data is not valid.', formatIssues(result.error)));
      return;
    }
    if (source === 'query') {
      // req.query is a getter-only property on Express 5-style requests.
      Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
    } else {
      req[source] = result.data as never;
    }
    next();
  };

export type Infer<T extends ZodTypeAny> = z.infer<T>;
