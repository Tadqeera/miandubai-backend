import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { authed, closeDatabase, createTestAdmin, makeTestImage, resetDatabase, signIn, type Session } from './helpers.js';
import { prisma } from '../src/lib/prisma.js';

/**
 * Reproduces the production failure behind "This product cannot be saved yet /
 * Something went wrong" when editing a product on admin.miandubai.com.
 *
 * Prisma closes an interactive `$transaction(async (tx) => …)` once its time
 * limit passes (P2028). Against the remote production database, rewriting an
 * existing product's translations, images, categories and collections took
 * longer than that limit. In this file the limit is cut to one millisecond, so
 * a save that depends on an interactive transaction fails here exactly as it
 * did in production — without depending on real network latency.
 */
const harness = vi.hoisted(() => ({ interactive: 0, batched: 0 }));

vi.mock('../src/lib/prisma.js', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const client = new PrismaClient({ log: ['warn'] });
  const transaction = client.$transaction.bind(client) as (work: unknown, options?: object) => Promise<unknown>;

  const $transaction = (work: unknown, options?: object) => {
    if (typeof work === 'function') {
      harness.interactive += 1;
      return transaction(work, { ...options, maxWait: 5_000, timeout: 1 });
    }
    harness.batched += 1;
    return transaction(work, options);
  };

  // Only $transaction differs; everything else is the real client, bound to itself.
  const prisma = new Proxy(client, {
    get: (target, key) => {
      if (key === '$transaction') return $transaction;
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return { prisma };
});

let session: Session;

describe('saving an existing product when transactions are short-lived (production regression)', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
    session = await signIn();
  });

  afterAll(closeDatabase);

  it('edits and publishes an existing product with several images all the same', async () => {
    const mediaIds: number[] = [];
    for (let index = 0; index < 3; index += 1) {
      const upload = await authed(session)
        .post('/api/v1/admin/media')
        .attach('files', await makeTestImage(), { filename: `zar-khadra-${index}.png`, contentType: 'image/png' });
      expect(upload.status, JSON.stringify(upload.body)).toBe(201);
      mediaIds.push(upload.body.data.items[0].id);
    }

    const payload = {
      sku: 'ZK-EXTRAIT-80',
      sizeMl: 80,
      priceUsd: '189.00',
      stockQuantity: 4,
      fragranceType: 'EXTRAIT_DE_PARFUM',
      status: 'PUBLISHED',
      images: mediaIds.map((mediaAssetId, index) => ({ mediaAssetId, isPrimary: index === 0, sortOrder: index })),
      translations: [
        { locale: 'en', name: 'Zar Khadra Extrait de Parfum 80ml' },
        { locale: 'fr', name: 'Zar Khadra Extrait de Parfum 80 ml' },
        { locale: 'es', name: 'Zar Khadra Extrait de Parfum 80 ml' },
      ],
    };

    const created = await authed(session).post('/api/v1/admin/products').send(payload);
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const before = { ...harness };

    const edited = await authed(session)
      .put(`/api/v1/admin/products/${created.body.data.id}`)
      .send({ ...payload, slug: created.body.data.slug, stockQuantity: 9 });
    expect(edited.status, JSON.stringify(edited.body)).toBe(200);

    expect(edited.body.data).toMatchObject({ status: 'PUBLISHED', stockQuantity: 9, sku: 'ZK-EXTRAIT-80' });
    expect(edited.body.data.images.map((image: { mediaAssetId: number }) => image.mediaAssetId)).toEqual(mediaIds);
    expect(harness.interactive - before.interactive).toBe(0);
    expect(harness.batched - before.batched).toBe(1);
  });

  // Last on purpose: it leaves an expired transaction behind, and nothing after
  // it in this file should share a connection that is still rolling back.
  it('the harness really expires an interactive transaction, as production did', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.product.count();
        await new Promise((resolve) => setTimeout(resolve, 25));
        await tx.product.count();
      }),
    ).rejects.toMatchObject({ code: 'P2028' });
  });
});
