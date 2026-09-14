import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  app,
  authed,
  closeDatabase,
  createTestAdmin,
  resetDatabase,
  signIn,
  type Session,
} from './helpers.js';

const EVENTS = '/api/v1/whatsapp-events';
const ACTIVITY = '/api/v1/admin/whatsapp';

describe('WhatsApp interaction tracking', () => {
  let session: Session;

  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
    session = await signIn();
  });

  beforeEach(async () => {
    await request(app).post('/api/v1/admin/auth/me').catch(() => undefined);
  });

  afterAll(closeDatabase);

  it('records a click and answers 202 without echoing anything back', async () => {
    const response = await request(app)
      .post(EVENTS)
      .send({ source: 'GLOBAL', pagePath: '/en', locale: 'en', currency: 'USD' })
      .expect(202);

    expect(response.body.data).toEqual({ recorded: true });
  });

  it('keeps a snapshot of the product so the row survives a rename', async () => {
    await request(app)
      .post(EVENTS)
      .send({
        source: 'PRODUCT',
        productId: 9999,
        productSlug: 'amber-signature',
        productName: 'Amber Signature',
        pagePath: '/en/product/amber-signature',
        locale: 'fr',
        currency: 'AED',
      })
      .expect(202);

    const { body } = await authed(session).get(`${ACTIVITY}?range=all`).expect(200);
    const row = body.data.items.find((entry: { productSlug: string }) => entry.productSlug === 'amber-signature');

    expect(row).toMatchObject({
      source: 'PRODUCT',
      productName: 'Amber Signature',
      locale: 'fr',
      currency: 'AED',
    });
  });

  it('strips the query string from the recorded path', async () => {
    await request(app)
      .post(EVENTS)
      .send({ source: 'BAG', pagePath: '/en/bag?q=secret-search-term', locale: 'en', currency: 'USD' })
      .expect(202);

    const { body } = await authed(session).get(`${ACTIVITY}?range=all&source=BAG`).expect(200);

    expect(body.data.items[0].pagePath).toBe('/en/bag');
    expect(JSON.stringify(body.data)).not.toContain('secret-search-term');
  });

  it('never invents a contact — name and phone stay null unless supplied', async () => {
    await request(app)
      .post(EVENTS)
      .send({ source: 'CONTACT', pagePath: '/en/contact', locale: 'en', currency: 'USD' })
      .expect(202);

    const { body } = await authed(session).get(`${ACTIVITY}?range=all&source=CONTACT`).expect(200);

    expect(body.data.items[0].contactName).toBeNull();
    expect(body.data.items[0].contactPhone).toBeNull();
  });

  it('stores a volunteered name and phone when one is sent', async () => {
    await request(app)
      .post(EVENTS)
      .send({
        source: 'PRODUCT',
        pagePath: '/en/product/x',
        locale: 'en',
        currency: 'USD',
        contactName: 'A Customer',
        contactPhone: '+1 555 000 0000',
      })
      .expect(202);

    const { body } = await authed(session).get(`${ACTIVITY}?range=all`).expect(200);
    const row = body.data.items.find((entry: { contactName: string | null }) => entry.contactName === 'A Customer');

    expect(row.contactPhone).toBe('+1 555 000 0000');
  });

  it('rejects an unknown source', async () => {
    // 422 is this API's convention for a body that fails schema validation.
    await request(app).post(EVENTS).send({ source: 'EMAIL', pagePath: '/en' }).expect(422);
  });

  it('summarises counts and groups by source and product', async () => {
    const { body } = await authed(session).get(`${ACTIVITY}?range=all`).expect(200);

    expect(body.data.counts.allTime).toBeGreaterThanOrEqual(5);
    expect(body.data.bySource.PRODUCT).toBeGreaterThanOrEqual(2);
    expect(body.data.byProduct.some((entry: { slug: string }) => entry.slug === 'amber-signature')).toBe(true);
  });

  it('requires an administrator session to read the activity log', async () => {
    await request(app).get(ACTIVITY).expect(401);
  });
});
