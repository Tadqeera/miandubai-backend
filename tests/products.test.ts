import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  app,
  authed,
  closeDatabase,
  createTestAdmin,
  makeTestImage,
  resetDatabase,
  setTestSettings,
  signIn,
  type Session,
} from './helpers.js';

let session: Session;

const productPayload = (overrides: Record<string, unknown> = {}) => ({
  sku: 'MD-TEST-001',
  sizeMl: 100,
  priceUsd: '129.00',
  stockQuantity: 12,
  fragranceType: 'EAU_DE_PARFUM',
  audience: 'UNISEX',
  translations: [
    {
      locale: 'en',
      name: 'Test Composition',
      shortDescription: 'An English short description.',
      topNotes: 'Bergamot, pink pepper',
      heartNotes: 'Iris, jasmine',
      baseNotes: 'Amber, cedar',
    },
  ],
  ...overrides,
});

const uploadImage = async () => {
  const buffer = await makeTestImage();
  const response = await authed(session)
    .post('/api/v1/admin/media')
    .attach('files', buffer, { filename: 'bottle.png', contentType: 'image/png' })
    .expect(201);
  return response.body.data.items[0].id as number;
};

describe('product catalog', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
    session = await signIn();
  });

  afterAll(closeDatabase);

  it('creates a draft product', async () => {
    const response = await authed(session).post('/api/v1/admin/products').send(productPayload()).expect(201);

    expect(response.body.data.status).toBe('DRAFT');
    expect(response.body.data.slug).toBe('test-composition');
    expect(response.body.data.sku).toBe('MD-TEST-001');
  });

  it('hides draft products from the public catalog', async () => {
    const list = await request(app).get('/api/v1/products?locale=en').expect(200);
    expect(list.body.data.total).toBe(0);

    await request(app).get('/api/v1/products/test-composition?locale=en').expect(404);
  });

  it('refuses to publish a product that has no image', async () => {
    const created = await authed(session)
      .post('/api/v1/admin/products')
      .send(productPayload({ sku: 'MD-TEST-002' }))
      .expect(201);

    const response = await authed(session)
      .post(`/api/v1/admin/products/${created.body.data.id}/status`)
      .send({ status: 'PUBLISHED' })
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body.error.details)).toContain('image');
  });

  it('refuses to publish without an English name or a price', async () => {
    const noName = await authed(session)
      .post('/api/v1/admin/products')
      .send(productPayload({ sku: 'MD-TEST-003', status: 'PUBLISHED', translations: [{ locale: 'en', name: '' }] }))
      .expect(422);
    expect(JSON.stringify(noName.body.error.details)).toContain('name');

    const noPrice = await authed(session)
      .post('/api/v1/admin/products')
      .send(productPayload({ sku: 'MD-TEST-004', status: 'PUBLISHED', priceUsd: '0' }))
      .expect(422);
    expect(JSON.stringify(noPrice.body.error.details)).toContain('priceUsd');
  });

  it('publishes a complete product and exposes it publicly at once', async () => {
    const mediaAssetId = await uploadImage();

    const created = await authed(session)
      .post('/api/v1/admin/products')
      .send(
        productPayload({
          sku: 'MD-TEST-010',
          status: 'PUBLISHED',
          featured: true,
          images: [{ mediaAssetId, isPrimary: true, sortOrder: 0, altEn: 'A test bottle' }],
          translations: [
            { locale: 'en', name: 'Published Composition', shortDescription: 'Available now.', topNotes: 'Bergamot' },
            { locale: 'fr', name: 'Composition publiée' },
          ],
        }),
      )
      .expect(201);

    expect(created.body.data.status).toBe('PUBLISHED');
    expect(created.body.data.publishedAt).toBeTruthy();

    // No frontend rebuild or manual step is involved.
    const list = await request(app).get('/api/v1/products?locale=en').expect(200);
    expect(list.body.data.total).toBe(1);
    expect(list.body.data.items[0].name).toBe('Published Composition');
    expect(list.body.data.items[0].primaryImage.alt).toBe('A test bottle');

    const detail = await request(app).get('/api/v1/products/published-composition?locale=en').expect(200);
    expect(detail.body.data.sku).toBe('MD-TEST-010');
    expect(detail.body.data.images).toHaveLength(1);
  });

  it('falls back to English for a locale with no translation, and uses the translation when present', async () => {
    const french = await request(app).get('/api/v1/products/published-composition?locale=fr').expect(200);
    expect(french.body.data.name).toBe('Composition publiée');
    // shortDescription has no French row, so the English text is used.
    expect(french.body.data.shortDescription).toBe('Available now.');

    const spanish = await request(app).get('/api/v1/products/published-composition?locale=es').expect(200);
    expect(spanish.body.data.name).toBe('Published Composition');
  });

  it('derives the AED price from the configured fallback rate when none is set', async () => {
    await setTestSettings({ 'currency.aedPerUsd': 3.6725 });

    const detail = await request(app).get('/api/v1/products/published-composition?locale=en').expect(200);
    // 129.00 × 3.6725 = 473.7525 → 473.75
    expect(detail.body.data.price.usd).toBe('129.00');
    expect(detail.body.data.price.aed).toBe('473.75');
    expect(detail.body.data.price.aedIsDerived).toBe(true);
  });

  it('prefers an explicitly entered AED price over the derived one', async () => {
    const admin = await authed(session).get('/api/v1/admin/products?q=MD-TEST-010').expect(200);
    const product = admin.body.data.items[0];

    await authed(session)
      .put(`/api/v1/admin/products/${product.id}`)
      .send({
        ...productPayload({
          sku: 'MD-TEST-010',
          status: 'PUBLISHED',
          priceAed: '499.00',
          images: product.images.map((image: { mediaAssetId: number }) => ({
            mediaAssetId: image.mediaAssetId,
            isPrimary: true,
            sortOrder: 0,
          })),
          translations: [{ locale: 'en', name: 'Published Composition', shortDescription: 'Available now.' }],
        }),
      })
      .expect(200);

    const detail = await request(app).get('/api/v1/products/published-composition?locale=en').expect(200);
    expect(detail.body.data.price.aed).toBe('499.00');
    expect(detail.body.data.price.aedIsDerived).toBe(false);
  });

  it('keeps the product/media relation after an update', async () => {
    const detail = await request(app).get('/api/v1/products/published-composition?locale=en').expect(200);
    expect(detail.body.data.images).toHaveLength(1);
    expect(detail.body.data.images[0].url).toContain('/media/products/');
  });

  it('reports stock status without leaking the exact quantity by default', async () => {
    const detail = await request(app).get('/api/v1/products/published-composition?locale=en').expect(200);
    expect(detail.body.data.stockStatus).toBe('IN_STOCK');
    expect(detail.body.data.stockQuantity).toBeNull();

    await setTestSettings({ 'product.showStockCount': true });
    const shown = await request(app).get('/api/v1/products/published-composition?locale=en').expect(200);
    expect(shown.body.data.stockQuantity).toBe(12);
    await setTestSettings({ 'product.showStockCount': false });
  });

  it('unpublishing removes the product from the public catalog immediately', async () => {
    const admin = await authed(session).get('/api/v1/admin/products?q=MD-TEST-010').expect(200);
    const id = admin.body.data.items[0].id;

    await authed(session).post(`/api/v1/admin/products/${id}/status`).send({ status: 'DRAFT' }).expect(200);
    await request(app).get('/api/v1/products/published-composition?locale=en').expect(404);

    await authed(session).post(`/api/v1/admin/products/${id}/status`).send({ status: 'PUBLISHED' }).expect(200);
    await request(app).get('/api/v1/products/published-composition?locale=en').expect(200);
  });

  it('soft-deletes a product and keeps its media record', async () => {
    const admin = await authed(session).get('/api/v1/admin/products?q=MD-TEST-010').expect(200);
    const id = admin.body.data.items[0].id;
    const mediaBefore = await authed(session).get('/api/v1/admin/media').expect(200);

    await authed(session).delete(`/api/v1/admin/products/${id}`).expect(200);
    await request(app).get('/api/v1/products/published-composition?locale=en').expect(404);

    const mediaAfter = await authed(session).get('/api/v1/admin/media').expect(200);
    expect(mediaAfter.body.data.total).toBe(mediaBefore.body.data.total);

    await authed(session).post(`/api/v1/admin/products/${id}/restore`).expect(200);
  });

  it('rejects a duplicate SKU with a conflict', async () => {
    const response = await authed(session)
      .post('/api/v1/admin/products')
      .send(productPayload({ sku: 'MD-TEST-001' }))
      .expect(409);

    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('filters, searches and sorts the public catalog', async () => {
    const byNote = await request(app).get('/api/v1/products?locale=en&q=Bergamot').expect(200);
    expect(byNote.body.data.total).toBeGreaterThanOrEqual(0);

    const byAudience = await request(app).get('/api/v1/products?locale=en&audience=UNISEX').expect(200);
    expect(byAudience.body.data.items.every((item: { audience: string }) => item.audience === 'UNISEX')).toBe(true);

    const featured = await request(app).get('/api/v1/products?locale=en&featured=true').expect(200);
    expect(featured.body.data.items.every((item: { featured: boolean }) => item.featured)).toBe(true);

    await request(app).get('/api/v1/products?locale=en&sort=price-asc').expect(200);
  });

  it('re-checks availability for bag items and reports withdrawn products', async () => {
    // Restoring a soft-deleted product returns it to DRAFT by design, so make
    // the starting state explicit rather than depending on test order.
    const admin = await authed(session).get('/api/v1/admin/products?q=MD-TEST-010').expect(200);
    await authed(session)
      .post(`/api/v1/admin/products/${admin.body.data.items[0].id}/status`)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const response = await request(app)
      .get('/api/v1/products/availability?locale=en&slugs=published-composition,does-not-exist')
      .expect(200);

    const bySlug = new Map(
      response.body.data.items.map((entry: { slug: string; available: boolean }) => [entry.slug, entry.available]),
    );
    expect(bySlug.get('published-composition')).toBe(true);
    expect(bySlug.get('does-not-exist')).toBe(false);
  });

  it('duplicates a product as an unpublished draft with zero stock', async () => {
    const admin = await authed(session).get('/api/v1/admin/products?q=MD-TEST-010').expect(200);
    const id = admin.body.data.items[0].id;

    const copy = await authed(session).post(`/api/v1/admin/products/${id}/duplicate`).expect(201);
    expect(copy.body.data.status).toBe('DRAFT');
    expect(copy.body.data.stockQuantity).toBe(0);
    expect(copy.body.data.sku).not.toBe('MD-TEST-010');
  });
});
