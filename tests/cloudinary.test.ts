import path from 'node:path';
import { PassThrough } from 'node:stream';
import { inspect } from 'node:util';
import { v2 as cloudinary } from 'cloudinary';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseEnvironment } from '../src/config/env.js';
import { CloudinaryStorage } from '../src/storage/cloudinary.js';

// Placeholder values only. Real credentials never belong in tests.
const FAKE = {
  cloudName: 'test-cloud',
  apiKey: 'placeholder-api-key-000',
  apiSecret: 'placeholder-api-secret-000',
};

const BASE_ENV = {
  DATABASE_URL: 'mysql://root:@127.0.0.1:3306/miandubai_test',
  AUTH_JWT_SECRET: 'test-secret-value-that-is-long-enough-for-validation',
};

const CLOUDINARY_ENV = {
  ...BASE_ENV,
  MEDIA_STORAGE_DRIVER: 'cloudinary',
  CLOUDINARY_CLOUD_NAME: FAKE.cloudName,
  CLOUDINARY_API_KEY: FAKE.apiKey,
  CLOUDINARY_API_SECRET: FAKE.apiSecret,
};

const errorMessageOf = (run: () => unknown): string => {
  try {
    run();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

describe('media storage configuration', () => {
  it('keeps local filesystem mode working without any Cloudinary variables', () => {
    const parsed = parseEnvironment({
      ...BASE_ENV,
      MEDIA_STORAGE_DRIVER: 'filesystem',
      MEDIA_ROOT: 'C:/xampp/htdocs/miandubai-media',
    });

    expect(parsed.MEDIA_STORAGE_DRIVER).toBe('filesystem');
    expect(parsed.MEDIA_ROOT).toBe(path.resolve('C:/xampp/htdocs/miandubai-media'));
    expect(parsed.servesMediaLocally).toBe(true);
    expect(parsed.mediaServedBy).toBe('backend');
    expect(parsed.CLOUDINARY_API_SECRET).toBeUndefined();
  });

  it('still requires MEDIA_ROOT for the filesystem driver', () => {
    expect(errorMessageOf(() => parseEnvironment({ ...BASE_ENV, MEDIA_STORAGE_DRIVER: 'filesystem' }))).toContain(
      'MEDIA_ROOT is required when MEDIA_STORAGE_DRIVER=filesystem',
    );
    expect(errorMessageOf(() => parseEnvironment({ ...BASE_ENV, MEDIA_ROOT: '' }))).toContain('MEDIA_ROOT');
  });

  it('refuses the cloudinary driver when any credential is missing, without echoing values', () => {
    for (const missing of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
      const message = errorMessageOf(() => parseEnvironment({ ...CLOUDINARY_ENV, [missing]: '' }));

      expect(message).toContain(`${missing} is required when MEDIA_STORAGE_DRIVER=cloudinary`);
      expect(message).not.toContain(FAKE.apiKey);
      expect(message).not.toContain(FAKE.apiSecret);
    }
  });

  it('does not require MEDIA_ROOT for the cloudinary driver and never serves media locally', () => {
    const parsed = parseEnvironment(CLOUDINARY_ENV);

    expect(parsed.MEDIA_STORAGE_DRIVER).toBe('cloudinary');
    expect(parsed.MEDIA_ROOT).toBe('');
    expect(parsed.servesMediaLocally).toBe(false);
    expect(parsed.mediaServedBy).toBe('cloudinary');
  });

  it('rejects an unknown driver instead of silently falling back to filesystem', () => {
    expect(
      errorMessageOf(() => parseEnvironment({ ...BASE_ENV, MEDIA_STORAGE_DRIVER: 's3', MEDIA_ROOT: '../media' })),
    ).toContain('MEDIA_STORAGE_DRIVER');
  });
});

describe('storage factory in cloudinary mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('selects CloudinaryStorage and skips the filesystem-only MEDIA_ROOT checks', async () => {
    vi.stubEnv('MEDIA_STORAGE_DRIVER', 'cloudinary');
    vi.stubEnv('MEDIA_ROOT', '');
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', FAKE.cloudName);
    vi.stubEnv('CLOUDINARY_API_KEY', FAKE.apiKey);
    vi.stubEnv('CLOUDINARY_API_SECRET', FAKE.apiSecret);
    vi.resetModules();

    const { storage, initStorage } = await import('../src/storage/index.js');

    expect(storage.driver).toBe('cloudinary');
    expect(storage.location).toBe(`cloudinary://${FAKE.cloudName}`);
    // An empty MEDIA_ROOT resolves to the backend folder, so this would throw
    // if the filesystem guard still ran for Cloudinary.
    await expect(initStorage()).resolves.toBeUndefined();
  });
});

describe('CloudinaryStorage', () => {
  const storage = new CloudinaryStorage(FAKE);
  const original = 'products/2026/09/0123456789abcdef0123456789abcdef.jpg';
  const variant = 'products/2026/09/0123456789abcdef0123456789abcdef-400.webp';

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('describes its location without exposing credentials', () => {
    expect(storage.driver).toBe('cloudinary');
    expect(storage.location).toBe('cloudinary://test-cloud');

    const serialized = `${JSON.stringify(storage)} ${inspect(storage, { depth: 5, showHidden: true })}`;
    expect(serialized).not.toContain(FAKE.apiKey);
    expect(serialized).not.toContain(FAKE.apiSecret);
  });

  it('refuses to be constructed without every credential', () => {
    expect(() => new CloudinaryStorage({ ...FAKE, apiSecret: '' })).toThrow(/CLOUDINARY_API_SECRET/);
  });

  it('derives deterministic secure delivery URLs that keep the folder and format', () => {
    const url = storage.getPublicUrl(variant);

    expect(url).toBe(
      'https://res.cloudinary.com/test-cloud/image/upload/v1/products/2026/09/0123456789abcdef0123456789abcdef-400.webp',
    );
    expect(storage.getPublicUrl(variant)).toBe(url);
    expect(storage.getPublicUrl(original)).toMatch(/\/image\/upload\/v1\/products\/2026\/09\/[0-9a-f]{32}\.jpg$/);
    expect(url).not.toContain(FAKE.apiKey);
    expect(url).not.toContain(FAKE.apiSecret);
  });

  it('rejects unsafe or extension-less keys', () => {
    expect(() => storage.getPublicUrl('../secrets.jpg')).toThrow('Invalid media key.');
    expect(() => storage.getPublicUrl('products/2026/09/no-extension')).toThrow('Invalid media key.');
    expect(() => storage.getPublicUrl('products/2026/09/.jpg')).toThrow('Invalid media key.');
  });

  it('uploads the buffer under a public ID and format derived from the key', async () => {
    let received = Buffer.alloc(0);
    const uploadStream = vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((
      _options: unknown,
      callback: (error?: unknown, result?: unknown) => void,
    ) => {
      const stream = new PassThrough();
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        received = Buffer.concat(chunks);
        callback(undefined, { public_id: 'ok' });
      });
      return stream;
    }) as never);

    const data = Buffer.from('webp-bytes');
    await expect(storage.save(variant, data)).resolves.toEqual({ key: variant, sizeBytes: data.byteLength });

    expect(received.equals(data)).toBe(true);
    expect(uploadStream.mock.calls[0]?.[0]).toMatchObject({
      resource_type: 'image',
      type: 'upload',
      public_id: 'products/2026/09/0123456789abcdef0123456789abcdef-400',
      format: 'webp',
      asset_folder: 'products/2026/09',
      overwrite: true,
    });
  });

  it('reports upload failures without leaking credentials', async () => {
    vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((
      _options: unknown,
      callback: (error?: unknown, result?: unknown) => void,
    ) => {
      const stream = new PassThrough();
      stream.resume();
      stream.on('end', () => callback({ message: `Invalid api_key ${FAKE.apiKey} / ${FAKE.apiSecret}`, http_code: 401 }));
      return stream;
    }) as never);

    const failure = storage.save(original, Buffer.from('jpeg-bytes'));
    await expect(failure).rejects.toThrow(/Cloudinary upload failed .*\(HTTP 401\)/);
    const message = await failure.catch((error: Error) => error.message);
    expect(message).not.toContain(FAKE.apiKey);
    expect(message).not.toContain(FAKE.apiSecret);
  });

  it('destroys with invalidation and tolerates assets that are already gone', async () => {
    const destroy = vi.spyOn(cloudinary.uploader, 'destroy').mockResolvedValueOnce({ result: 'ok' });
    await expect(storage.delete(variant)).resolves.toBeUndefined();
    expect(destroy).toHaveBeenCalledWith(
      'products/2026/09/0123456789abcdef0123456789abcdef-400',
      expect.objectContaining({ resource_type: 'image', type: 'upload', invalidate: true }),
    );

    destroy.mockResolvedValueOnce({ result: 'not found' });
    await expect(storage.delete(variant)).resolves.toBeUndefined();

    destroy.mockRejectedValueOnce({ message: 'Resource not found', http_code: 404 });
    await expect(storage.delete(variant)).resolves.toBeUndefined();

    destroy.mockRejectedValueOnce({ message: 'Server error', http_code: 500 });
    await expect(storage.delete(variant)).rejects.toThrow(/Cloudinary delete failed .*\(HTTP 500\)/);
  });

  it('checks existence against the specific asset and treats not-found as false', async () => {
    const resource = vi.spyOn(cloudinary.api, 'resource').mockResolvedValueOnce({ format: 'webp' });
    await expect(storage.exists(variant)).resolves.toBe(true);
    expect(resource).toHaveBeenCalledWith(
      'products/2026/09/0123456789abcdef0123456789abcdef-400',
      expect.objectContaining({ resource_type: 'image', type: 'upload' }),
    );

    resource.mockResolvedValueOnce({ format: 'png' });
    await expect(storage.exists(variant)).resolves.toBe(false);

    resource.mockRejectedValueOnce({ message: 'Resource not found', http_code: 404 });
    await expect(storage.exists(variant)).resolves.toBe(false);

    resource.mockRejectedValueOnce({ error: { message: 'Resource not found', http_code: 404 } });
    await expect(storage.exists(variant)).resolves.toBe(false);
  });

  it('reads asset contents from the secure delivery URL', async () => {
    const fetchMock = vi.fn(async () => new Response('image-bytes', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const buffer = await storage.read(variant);
    expect(buffer.toString()).toBe('image-bytes');
    expect(fetchMock).toHaveBeenCalledWith(storage.getPublicUrl(variant));

    fetchMock.mockResolvedValueOnce(new Response('missing', { status: 404 }));
    await expect(storage.read(variant)).rejects.toMatchObject({ code: 'NOT_FOUND' });

    fetchMock.mockResolvedValueOnce(new Response('unavailable', { status: 503 }));
    await expect(storage.read(variant)).rejects.toThrow(/HTTP 503/);
  });
});
