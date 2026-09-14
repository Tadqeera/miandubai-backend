import multer from 'multer';
import { env } from '../config/env.js';

const ACCEPTED_CLIENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * Buffers uploads in memory — nothing is ever written to a temporary path
 * derived from a user-supplied filename. The declared MIME type is only a
 * cheap first filter; the real check is the magic-byte inspection in
 * `detectImageMime`.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MEDIA_MAX_UPLOAD_BYTES,
    files: 12,
    fields: 20,
  },
  fileFilter: (_req, file, callback) => {
    if (!ACCEPTED_CLIENT_TYPES.has(file.mimetype)) {
      callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      return;
    }
    callback(null, true);
  },
});
