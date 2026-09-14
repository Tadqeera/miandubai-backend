import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { assertSafeKey } from './keys.js';
import type { SavedObject, StorageService } from './types.js';

/**
 * Writes to MEDIA_ROOT, an absolute path supplied by configuration. No Windows
 * or server path is ever hardcoded in source, and MEDIA_ROOT must point
 * outside the backend deployment directory.
 */
export class FilesystemStorage implements StorageService {
  readonly driver = 'filesystem';

  constructor(private readonly root: string) {}

  get location(): string {
    return this.root;
  }

  private resolve(key: string): string {
    const safeKey = assertSafeKey(key);
    const target = path.resolve(this.root, safeKey);
    const rootWithSep = this.root.endsWith(path.sep) ? this.root : this.root + path.sep;
    if (!target.startsWith(rootWithSep)) {
      throw ApiError.badRequest('Invalid media key.');
    }
    return target;
  }

  async save(key: string, data: Buffer): Promise<SavedObject> {
    const target = this.resolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    return { key: assertSafeKey(key), sizeBytes: data.byteLength };
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    const safeKey = assertSafeKey(key);
    const base = env.servesMediaLocally ? `${env.PUBLIC_BASE_URL}/media` : env.MEDIA_PUBLIC_URL;
    return `${base}/${safeKey}`;
  }

  async ensureRoot(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
  }
}
