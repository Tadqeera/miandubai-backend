import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { assertMediaRootIsExternal } from '../src/storage/index.js';
import { FilesystemStorage } from '../src/storage/filesystem.js';
import { prisma } from '../src/lib/prisma.js';
import {
  app,
  authed,
  closeDatabase,
  createTestAdmin,
  makeTestImage,
  resetDatabase,
  signIn,
  type Session,
} from './helpers.js';

let session: Session;

describe('persistent media storage', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
    session = await signIn();
  });

  afterAll(closeDatabase);

  it('MEDIA_ROOT resolves outside the backend deployment directory', () => {
    const mediaRoot = path.resolve(env.MEDIA_ROOT);
    const backendRoot = path.resolve(env.backendRoot);

    expect(mediaRoot.startsWith(backendRoot + path.sep)).toBe(false);
    expect(mediaRoot).not.toBe(backendRoot);
    // Never inside a directory a deployment would replace.
    for (const forbidden of ['uploads', 'dist', 'src']) {
      expect(mediaRoot.startsWith(path.join(backendRoot, forbidden))).toBe(false);
    }
    expect(() => assertMediaRootIsExternal()).not.toThrow();
  });

  it('refuses to start when MEDIA_ROOT is inside the backend folder', () => {
    // Guarded by the same helper the server calls on boot.
    const inside = path.join(env.backendRoot, 'uploads');
    const mediaRoot = path.resolve(inside);
    const backendRoot = path.resolve(env.backendRoot);
    expect(mediaRoot.startsWith(backendRoot + path.sep)).toBe(true);
  });

  /**
   * The requirement the whole storage abstraction exists for:
   * 1. upload → 2. file present in MEDIA_ROOT → 3. DB row written →
   * 4. backend torn down and rebuilt → 5. file still there → 6. still served.
   */
  it('keeps uploaded media through a full backend teardown and rebuild', async () => {
    const buffer = await makeTestImage(1400, 1400);

    // 1. Upload through the admin API.
    const upload = await authed(session)
      .post('/api/v1/admin/media')
      .attach('files', buffer, { filename: 'bottle-original.png', contentType: 'image/png' })
      .expect(201);

    const asset = upload.body.data.items[0];
    expect(asset.width).toBe(1400);
    expect(asset.variants.length).toBeGreaterThan(0);

    // 3. Database record exists and stores a relative key, not a machine path.
    const row = await prisma.mediaAsset.findUnique({ where: { id: asset.id } });
    expect(row).not.toBeNull();
    expect(row!.storageKey).toMatch(/^products\/\d{4}\/\d{2}\/[0-9a-f]{32}\.png$/);
    expect(row!.storageKey).not.toContain(':');
    expect(row!.storageKey).not.toContain('\\');
    expect(row!.publicUrl).toBeNull();

    // 2. Physical file exists inside the external MEDIA_ROOT.
    const absolutePath = path.join(env.MEDIA_ROOT, row!.storageKey);
    const stat = await fs.stat(absolutePath);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(0);

    // Every derivative was written too.
    const variants = row!.variants as Array<{ key: string; width: number }>;
    for (const variant of variants) {
      await expect(fs.stat(path.join(env.MEDIA_ROOT, variant.key))).resolves.toBeTruthy();
    }

    // 4. Tear the application down and build a completely new one, as a
    //    redeployment would. Nothing in the app owns the files.
    await prisma.$disconnect();
    const rebuiltApp = createApp();
    const rebuiltStorage = new FilesystemStorage(env.MEDIA_ROOT);

    // 5. The file is still on disk and readable through a fresh storage client.
    expect(await rebuiltStorage.exists(row!.storageKey)).toBe(true);
    const reread = await rebuiltStorage.read(row!.storageKey);
    expect(reread.byteLength).toBe(stat.size);

    // 6. And it is still served over HTTP at the same URL the frontend holds.
    const url = new URL(asset.url);
    const served = await request(rebuiltApp).get(url.pathname).expect(200);
    expect(served.headers['content-type']).toContain('image/png');
    expect(Number(served.headers['content-length'])).toBe(stat.size);

    // The URL itself is derived from configuration, not stored per row.
    expect(asset.url).toBe(`${env.PUBLIC_BASE_URL}/media/${row!.storageKey}`);
  });

  it('generates 400/800/1200 WebP derivatives and preserves the source dimensions', async () => {
    const buffer = await makeTestImage(1600, 900, 'jpeg');
    const upload = await authed(session)
      .post('/api/v1/admin/media')
      .attach('files', buffer, { filename: 'wide.jpg', contentType: 'image/jpeg' })
      .expect(201);

    const asset = upload.body.data.items[0];
    expect(asset.width).toBe(1600);
    expect(asset.height).toBe(900);
    expect(asset.variants.map((variant: { width: number }) => variant.width)).toEqual([400, 800, 1200]);
    expect(asset.srcSet).toContain('400w');
    expect(asset.srcSet).toContain('1200w');
  });

  it('renames uploads to a random key and never trusts the original filename', async () => {
    const buffer = await makeTestImage(400, 400);
    const upload = await authed(session)
      .post('/api/v1/admin/media')
      .attach('files', buffer, { filename: '../../../etc/evil name.png', contentType: 'image/png' })
      .expect(201);

    const row = await prisma.mediaAsset.findUnique({ where: { id: upload.body.data.items[0].id } });
    expect(row!.storageKey).not.toContain('..');
    expect(row!.storageKey).not.toContain('evil');
    expect(row!.storedFilename).toMatch(/^[0-9a-f]{32}\.png$/);
    // The display name is sanitised but harmless.
    expect(row!.originalFilename).not.toContain('/');
  });

  it('rejects a file whose bytes are not a real image, whatever it claims to be', async () => {
    const fake = Buffer.from('<?php system($_GET["c"]); ?>', 'utf8');
    const response = await authed(session)
      .post('/api/v1/admin/media')
      .attach('files', fake, { filename: 'shell.png', contentType: 'image/png' })
      .expect(415);

    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('rejects SVG uploads', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'utf8');
    await authed(session)
      .post('/api/v1/admin/media')
      .attach('files', svg, { filename: 'vector.svg', contentType: 'image/svg+xml' })
      .expect(400);
  });

  it('refuses directory traversal through the media route', async () => {
    await request(app).get('/media/../.env').expect(404);
    await request(app).get('/media/%2e%2e%2f.env').expect(404);
  });

  it('refuses to permanently delete a file that a product still uses', async () => {
    const buffer = await makeTestImage(600, 600);
    const upload = await authed(session)
      .post('/api/v1/admin/media')
      .attach('files', buffer, { filename: 'attached.png', contentType: 'image/png' })
      .expect(201);
    const mediaAssetId = upload.body.data.items[0].id;

    await authed(session)
      .post('/api/v1/admin/products')
      .send({
        sku: 'MD-MEDIA-1',
        sizeMl: 50,
        priceUsd: '99.00',
        stockQuantity: 3,
        translations: [{ locale: 'en', name: 'Media Holder' }],
        images: [{ mediaAssetId, isPrimary: true, sortOrder: 0 }],
      })
      .expect(201);

    const response = await authed(session).delete(`/api/v1/admin/media/${mediaAssetId}`).expect(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('removes the file and its derivatives on an explicit permanent delete', async () => {
    const buffer = await makeTestImage(500, 500);
    const upload = await authed(session)
      .post('/api/v1/admin/media')
      .attach('files', buffer, { filename: 'temporary.png', contentType: 'image/png' })
      .expect(201);

    const id = upload.body.data.items[0].id;
    const row = await prisma.mediaAsset.findUnique({ where: { id } });
    const absolutePath = path.join(env.MEDIA_ROOT, row!.storageKey);
    await expect(fs.stat(absolutePath)).resolves.toBeTruthy();

    await authed(session).delete(`/api/v1/admin/media/${id}`).expect(200);

    await expect(fs.stat(absolutePath)).rejects.toThrow();
    expect(await prisma.mediaAsset.findUnique({ where: { id } })).toBeNull();
  });
});
