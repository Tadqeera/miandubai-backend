import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { ApiError } from '../src/lib/errors.js';
import { logger } from '../src/lib/logger.js';
import { errorHandler } from '../src/middleware/error.js';

interface Captured {
  status: number;
  body: { error: { code: string; message: string; details?: unknown } };
}

const respond = (error: unknown): Captured => {
  const captured = { status: 0, body: {} } as Captured;
  const res = {
    status(code: number) {
      captured.status = code;
      return res;
    },
    json(payload: unknown) {
      captured.body = payload as Captured['body'];
      return res;
    },
  };
  errorHandler(error, { path: '/api/v1/admin/products/7', method: 'PUT' } as never, res as never, () => undefined);
  return captured;
};

const known = (code: string, message: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: 'test', meta });

describe('API error responses', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('explains an expired database transaction (P2028) instead of answering "Something went wrong"', () => {
    const { status, body } = respond(
      known('P2028', 'Transaction API error: Transaction already closed: A commit cannot be executed on an expired transaction.'),
    );

    expect(status).toBe(503);
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(body.error.message).toBe('The database did not respond in time. Please try again in a moment.');
  });

  it('treats an unreachable database and an exhausted connection pool the same way', () => {
    expect(respond(new Prisma.PrismaClientInitializationError("Can't reach database server", 'test', 'P1001')).status).toBe(503);
    expect(respond(known('P2024', 'Timed out fetching a new connection from the connection pool.')).status).toBe(503);
  });

  it('recognises a Prisma error by its shape when the class does not match', () => {
    const foreign = Object.assign(new Error('Transaction already closed'), { code: 'P2028', clientVersion: '6.2.1' });
    expect(respond(foreign).body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('names the field of a unique-constraint conflict in plain words', () => {
    const { status, body } = respond(known('P2002', 'Unique constraint failed', { target: 'products_sku_key' }));
    expect(status).toBe(409);
    expect(body.error.message).toBe('A record with that SKU already exists.');
  });

  it('reports an over-long value as a validation problem on that field', () => {
    const { status, body } = respond(known('P2000', 'The provided value for the column is too long', { column_name: 'seoTitle' }));
    expect(status).toBe(422);
    expect(body.error.details).toEqual([{ field: 'seoTitle', message: 'This value is too long.' }]);
  });

  it('keeps an unknown failure generic, without internal detail in the message', () => {
    const { status, body } = respond(new Error('ECONNRESET at /srv/app/node_modules/internal.js'));
    expect(status).toBe(500);
    expect(body.error.message).toBe('Something went wrong. Please try again.');
  });

  it('passes an ApiError through untouched', () => {
    const { status, body } = respond(ApiError.conflict('Another product already uses the SKU "X".'));
    expect(status).toBe(409);
    expect(body.error.message).toBe('Another product already uses the SKU "X".');
  });
});
