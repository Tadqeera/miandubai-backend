import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../lib/errors.js';
import { assertSafeKey } from './keys.js';
import type { SavedObject, StorageService } from './types.js';

export interface CloudinaryStorageConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface CloudinaryAsset {
  /** The validated storage key, exactly as stored in the database. */
  key: string;
  /** `products/2026/09/<id>-400` — the key without its extension. */
  publicId: string;
  /** `webp` — the key's extension, used as the Cloudinary format. */
  format: string;
  /** `products/2026/09` — Media Library folder for dynamic-folder accounts. */
  folder: string;
}

const EXTENSION = /^[a-z0-9]+$/;

/**
 * Maps a storage key onto a deterministic Cloudinary public ID and format.
 * Originals and derivatives never share a public ID because derivatives carry
 * a `-<width>` suffix.
 */
const toAsset = (key: string): CloudinaryAsset => {
  const safeKey = assertSafeKey(key);
  const slash = safeKey.lastIndexOf('/');
  const dot = safeKey.lastIndexOf('.');
  const format = safeKey.slice(dot + 1);
  if (dot <= slash + 1 || !EXTENSION.test(format)) {
    throw ApiError.badRequest('Invalid media key.');
  }
  return {
    key: safeKey,
    publicId: safeKey.slice(0, dot),
    format,
    folder: slash === -1 ? '' : safeKey.slice(0, slash),
  };
};

/** The SDK rejects with plain `{ message, http_code }` objects, sometimes nested under `error`. */
const httpStatusOf = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  const candidate = error as { http_code?: unknown; error?: { http_code?: unknown } | null };
  const status = candidate.http_code ?? candidate.error?.http_code;
  return typeof status === 'number' ? status : undefined;
};

const messageOf = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (typeof error !== 'object' || error === null) return '';
  const candidate = error as { message?: unknown; error?: { message?: unknown } | null };
  const message = candidate.message ?? candidate.error?.message;
  return typeof message === 'string' ? message : '';
};

/**
 * Stores media in Cloudinary under the same logical keys the filesystem driver
 * writes, so database rows stay driver-agnostic:
 *
 *   products/2026/09/<id>-400.webp  →  public ID `products/2026/09/<id>-400`, format `webp`
 *
 * Credentials are passed per call rather than through the SDK's global config,
 * and live in private fields so they never appear in logs or serialized objects.
 */
export class CloudinaryStorage implements StorageService {
  readonly driver = 'cloudinary';

  readonly #cloudName: string;
  readonly #apiKey: string;
  readonly #apiSecret: string;

  constructor(config: CloudinaryStorageConfig) {
    if (!config.cloudName || !config.apiKey || !config.apiSecret) {
      throw new Error('Cloudinary storage requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
    }
    this.#cloudName = config.cloudName;
    this.#apiKey = config.apiKey;
    this.#apiSecret = config.apiSecret;
  }

  get location(): string {
    return `cloudinary://${this.#cloudName}`;
  }

  async save(key: string, data: Buffer): Promise<SavedObject> {
    const asset = toAsset(key);
    const options = {
      ...this.#credentials(),
      resource_type: 'image' as const,
      type: 'upload' as const,
      public_id: asset.publicId,
      format: asset.format,
      ...(asset.folder ? { asset_folder: asset.folder } : {}),
      overwrite: true,
      invalidate: true,
    };

    await new Promise<void>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) {
          reject(this.#failure('upload', asset.key, error));
          return;
        }
        resolve();
      });
      upload.end(data);
    });

    return { key: asset.key, sizeBytes: data.byteLength };
  }

  async read(key: string): Promise<Buffer> {
    const asset = toAsset(key);
    const response = await fetch(this.getPublicUrl(asset.key));
    if (response.status === 404) {
      throw ApiError.notFound('Media object not found.');
    }
    if (!response.ok) {
      throw new Error(`Cloudinary download failed for "${asset.key}" (HTTP ${response.status}).`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    const asset = toAsset(key);
    const options = { ...this.#credentials(), resource_type: 'image' as const, type: 'upload' as const, invalidate: true };

    let outcome: unknown;
    try {
      outcome = await cloudinary.uploader.destroy(asset.publicId, options);
    } catch (error) {
      if (httpStatusOf(error) === 404) return;
      throw this.#failure('delete', asset.key, error);
    }

    const result = (outcome as { result?: unknown } | null | undefined)?.result;
    // `not found` means the asset is already gone, which is the state we want.
    if (result === 'ok' || result === 'not found') return;
    throw new Error(`Cloudinary delete failed for "${asset.key}" (result: ${String(result)}).`);
  }

  async exists(key: string): Promise<boolean> {
    const asset = toAsset(key);
    const options = { ...this.#credentials(), resource_type: 'image' as const, type: 'upload' as const };

    try {
      const resource: unknown = await cloudinary.api.resource(asset.publicId, options);
      return (resource as { format?: unknown } | null | undefined)?.format === asset.format;
    } catch (error) {
      if (httpStatusOf(error) === 404) return false;
      throw this.#failure('lookup', asset.key, error);
    }
  }

  getPublicUrl(key: string): string {
    const asset = toAsset(key);
    const options = {
      cloud_name: this.#cloudName,
      secure: true,
      resource_type: 'image' as const,
      type: 'upload' as const,
      format: asset.format,
      // Keeps URLs identical across SDK upgrades (no `_a=` analytics parameter).
      urlAnalytics: false,
    };
    return cloudinary.url(asset.publicId, options);
  }

  #credentials() {
    return { cloud_name: this.#cloudName, api_key: this.#apiKey, api_secret: this.#apiSecret };
  }

  /** Wraps an SDK rejection in a real Error whose message can never contain credentials. */
  #failure(operation: string, key: string, error: unknown): Error {
    const status = httpStatusOf(error);
    const detail = [this.#apiKey, this.#apiSecret].reduce(
      (text, secret) => text.split(secret).join('[redacted]'),
      messageOf(error),
    );
    return new Error(
      `Cloudinary ${operation} failed for "${key}"${status ? ` (HTTP ${status})` : ''}${detail ? `: ${detail}` : ''}`,
    );
  }
}
