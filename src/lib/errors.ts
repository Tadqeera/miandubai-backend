export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CSRF_INVALID'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

const statusByCode: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CSRF_INVALID: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = statusByCode[code];
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError('BAD_REQUEST', message, details);
  }

  static validation(message: string, details?: unknown) {
    return new ApiError('VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required.') {
    return new ApiError('UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiError('FORBIDDEN', message);
  }

  /** A missing or mismatched CSRF token: still a 403, with its own code so a client can fetch a fresh token. */
  static csrf(message: string) {
    return new ApiError('CSRF_INVALID', message);
  }

  static notFound(message = 'Resource not found.') {
    return new ApiError('NOT_FOUND', message);
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError('CONFLICT', message, details);
  }

  static unsupportedMedia(message: string) {
    return new ApiError('UNSUPPORTED_MEDIA_TYPE', message);
  }

  static tooLarge(message: string) {
    return new ApiError('PAYLOAD_TOO_LARGE', message);
  }
}
