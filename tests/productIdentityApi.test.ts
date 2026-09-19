import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
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

/**
 * The Zar Khadra defect, reproduced through the real API.
 *
 * Two fragrances are published exactly as the live catalogue holds them, and
 * then Zar Khadra's French and Spanish rows are given Zar Ameer's name — which
 * is what the production database actually contained, and what put the wrong
 * fragrance in the heading and the Product schema of a page whose slug, SKU and
 * price were Zar Khadra's throughout.
 *
 * Every public route that can name a product is checked, in every language, so
 * the storefront, the prerendered HTML and the structured data built from them
 * cannot disagree about which fragrance a page is about.
 */

let session: Session;

const LOCALES = ['en', 'fr', 'es'] as const;

const uploadImage = async (altEn: string) => {
  const buffer = await makeTestImage();
  const response = await authed(session)
    .post('/api/v1/admin/media')
    .attach('files', buffer, { filename: 'bottle.png', contentType: 'image/png' })
    .expect(201);
  return { mediaAssetId: response.body.data.items[0].id as number, isPrimary: true, sortOrder: 0, altEn };
};

const publish = async (payload: Record<string, unknown>) => {
  const created = await authed(session).post('/api/v1/admin/products').send(payload).expect(201);
  await authed(session)
    .post(`/api/v1/admin/products/${created.body.data.id}/status`)
    .send({ status: 'PUBLISHED' })
    .expect(200);
  return created.body.data as { id: number; slug: string };
};

let khadra: { id: number; slug: string };
let ameer: { id: number; slug: string };
/** Kept so the product can be saved again without losing its picture. */
let khadraImage: Awaited<ReturnType<typeof uploadImage>>;

describe('a translation cannot take on another product’s identity', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
    session = await signIn();

    ameer = await publish({
      sku: 'MD-ZAM-84',
      sizeMl: 80,
      priceUsd: '220.00',
      stockQuantity: 5,
      fragranceType: 'EXTRAIT_DE_PARFUM',
      audience: 'UNISEX',
      images: [await uploadImage('Zar Ameer Extrait de Parfum 80ml')],
      translations: LOCALES.map((locale) => ({
        locale,
        name: 'Zar Ameer Extrait de Parfum 80ml',
        shortDescription: 'An amber and leather extrait de parfum.',
      })),
    });

    khadraImage = await uploadImage('Zar Khadra Extrait de Parfum 80ml');

    khadra = await publish({
      sku: 'MD-ZKH-81',
      slug: 'zar-khadra-2',
      sizeMl: 80,
      priceUsd: '190.00',
      stockQuantity: 5,
      fragranceType: 'EXTRAIT_DE_PARFUM',
      audience: 'UNISEX',
      images: [khadraImage],
      translations: [
        { locale: 'en', name: 'Zar Khadra  Extrait de Parfum 80ml', shortDescription: 'A green, woody extrait.' },
        // The defect, exactly as production held it.
        {
          locale: 'fr',
          name: 'Zar Ameer Extrait de Parfum 80 ml | Mian Dubai',
          shortDescription: 'Un extrait de parfum vert et boisé.',
          seoTitle: 'Zar Khadra Extrait de Parfum 80 ml | Mian Dubai',
        },
        {
          locale: 'es',
          name: 'Zar Ameer Extrait de Parfum 80 ml | Mian Dubai',
          shortDescription: 'Un extrait de parfum verde y amaderado.',
          seoTitle: 'Zar Khadra Extrait de Parfum 80 ml | Mian Dubai',
        },
      ],
    });
  });

  afterAll(closeDatabase);

  it.each(LOCALES)('names Zar Khadra correctly on its product page in %s', async (locale) => {
    const response = await request(app).get(`/api/v1/products/${khadra.slug}?locale=${locale}`).expect(200);
    const product = response.body.data;

    expect(product.name).toContain('Zar Khadra');
    expect(product.name).not.toContain('Ameer');
    // The name is the page's h1 and its Product schema name: it must never
    // carry the brand suffix that belongs in a title.
    expect(product.name).not.toContain('| Mian Dubai');
    expect(product.name).not.toMatch(/\s{2,}/);

    // Everything that identifies the record stayed Zar Khadra's throughout.
    expect(product.sku).toBe('MD-ZKH-81');
    expect(product.slug).toBe('zar-khadra-2');
    expect(product.price.usd).toBe('190.00');

    for (const image of product.images) {
      expect(image.alt).not.toContain('Ameer');
      expect(image.alt).not.toContain('| Mian Dubai');
    }
  });

  it.each(LOCALES)('names Zar Khadra correctly in the catalogue listing in %s', async (locale) => {
    const response = await request(app).get(`/api/v1/products?locale=${locale}`).expect(200);
    const card = response.body.data.items.find((item: { slug: string }) => item.slug === khadra.slug);

    expect(card.name).toContain('Zar Khadra');
    expect(card.name).not.toContain('Ameer');
    expect(card.primaryImage.alt).not.toContain('Ameer');
  });

  it.each(LOCALES)('names Zar Khadra correctly as a related product in %s', async (locale) => {
    const response = await request(app).get(`/api/v1/products/${ameer.slug}/related?locale=${locale}`).expect(200);
    const card = response.body.data.items.find((item: { slug: string }) => item.slug === khadra.slug);

    if (card) {
      expect(card.name).toContain('Zar Khadra');
      expect(card.name).not.toContain('Ameer');
    }
  });

  it('leaves the product that was copied from entirely alone', async () => {
    for (const locale of LOCALES) {
      const response = await request(app).get(`/api/v1/products/${ameer.slug}?locale=${locale}`).expect(200);
      expect(response.body.data.name).toBe('Zar Ameer Extrait de Parfum 80ml');
      expect(response.body.data.sku).toBe('MD-ZAM-84');
    }
  });

  it('keeps the brand suffix in the SEO title, where it belongs', async () => {
    const response = await request(app).get(`/api/v1/products/${khadra.slug}?locale=fr`).expect(200);
    expect(response.body.data.seoTitle).toBe('Zar Khadra Extrait de Parfum 80 ml | Mian Dubai');
  });

  it('drops an SEO title that names the wrong product rather than serving it as a page title', async () => {
    await authed(session)
      .put(`/api/v1/admin/products/${khadra.id}`)
      .send({
        sku: 'MD-ZKH-81',
        slug: 'zar-khadra-2',
        // A save carries the whole record: omitting either of these would put
        // the product back into draft, or strip its picture.
        status: 'PUBLISHED',
        images: [khadraImage],
        sizeMl: 80,
        priceUsd: '190.00',
        stockQuantity: 5,
        fragranceType: 'EXTRAIT_DE_PARFUM',
        audience: 'UNISEX',
        translations: [
          { locale: 'en', name: 'Zar Khadra  Extrait de Parfum 80ml', shortDescription: 'A green, woody extrait.' },
          {
            locale: 'fr',
            name: 'Zar Khadra Extrait de Parfum 80 ml',
            shortDescription: 'Un extrait de parfum vert et boisé.',
            seoTitle: 'Zar Ameer Extrait de Parfum 80 ml | Mian Dubai',
          },
        ],
      })
      .expect(200);

    const response = await request(app).get(`/api/v1/products/${khadra.slug}?locale=fr`).expect(200);
    // Nulled, so the storefront derives the title from the corrected name
    // instead of publishing another fragrance's title on this page.
    expect(response.body.data.seoTitle).toBeNull();
    expect(response.body.data.name).toBe('Zar Khadra Extrait de Parfum 80 ml');
  });
});
