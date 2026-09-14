import path from 'node:path';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { CloudinaryStorage } from './cloudinary.js';
import { FilesystemStorage } from './filesystem.js';
import type { StorageService } from './types.js';

export * from './types.js';
export { assertSafeKey, buildStorageKey, withSuffix } from './keys.js';

const createStorage = (): StorageService => {
  switch (env.MEDIA_STORAGE_DRIVER) {
    case 'filesystem':
      return new FilesystemStorage(env.MEDIA_ROOT);
    case 'cloudinary':
      // Presence is already enforced by env validation; the driver re-checks.
      return new CloudinaryStorage({
        cloudName: env.CLOUDINARY_CLOUD_NAME ?? '',
        apiKey: env.CLOUDINARY_API_KEY ?? '',
        apiSecret: env.CLOUDINARY_API_SECRET ?? '',
      });
    default: {
      const unsupported: never = env.MEDIA_STORAGE_DRIVER;
      throw new Error(`Unsupported MEDIA_STORAGE_DRIVER "${String(unsupported)}".`);
    }
  }
};

export const storage = createStorage();

/**
 * Fails loudly when MEDIA_ROOT is inside the backend folder, because a
 * redeployment would then wipe uploaded product media. Filesystem driver only.
 */
export const assertMediaRootIsExternal = () => {
  const mediaRoot = path.resolve(env.MEDIA_ROOT);
  const backendRoot = path.resolve(env.backendRoot);
  const inside = mediaRoot === backendRoot || mediaRoot.startsWith(backendRoot + path.sep);
  if (inside) {
    throw new Error(
      `MEDIA_ROOT (${mediaRoot}) must live OUTSIDE the backend directory (${backendRoot}). ` +
        'Redeploying the backend would otherwise delete uploaded product media.',
    );
  }
};

export const initStorage = async () => {
  if (storage instanceof FilesystemStorage) {
    assertMediaRootIsExternal();
    await storage.ensureRoot();
  }
  logger.info({ driver: storage.driver, location: storage.location, servedBy: env.mediaServedBy }, 'Media storage ready');
};
