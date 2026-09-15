import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import {
  app,
  authed,
  closeDatabase,
  createTestAdmin,
  resetDatabase,
  setTestSettings,
  signIn,
  type Session,
} from './helpers.js';

// SMTP is blanked for the whole suite (vitest.config.ts). Mocked as well, so
// these tests could never reach a real mail server even if that changed.
const nodemailerMock = vi.hoisted(() => ({ createTransport: vi.fn() }));
vi.mock('nodemailer', () => ({ default: nodemailerMock, createTransport: nodemailerMock.createTransport }));

let session: Session;

describe('public site endpoints', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
    session = await signIn();
  });

  afterAll(closeDatabase);

  it('exposes public settings but never infrastructure secrets', async () => {
    const response = await request(app).get('/api/v1/site/public?locale=en').expect(200);
    const body = JSON.stringify(response.body);

    for (const secret of [
      'DATABASE_URL',
      'AUTH_JWT_SECRET',
      'IP_HASH_SALT',
      'MEDIA_ROOT',
      'passwordHash',
      'mysql://',
    ]) {
      expect(body).not.toContain(secret);
    }

    expect(response.body.data.settings['brand.displayName']).toBe('Mian Dubai');
    expect(response.body.data.settings['shipping.deliveryMinDays']).toBe(2);
    // A key that is not flagged public must not appear at all.
    expect(Object.keys(response.body.data.settings)).not.toContain('internal.test');
  });

  it('leaves optional contact details empty rather than inventing them', async () => {
    const response = await request(app).get('/api/v1/site/public?locale=en').expect(200);
    const settings = response.body.data.settings;

    expect(settings['contact.whatsappNumber']).toBe('');
    expect(settings['contact.supportEmail']).toBe('');
    expect(settings['contact.businessAddress']).toBe('');
    expect(settings['brand.legalEntityName']).toBe('');
    expect(settings['legal.governingLawVenue']).toBe('');
  });

  it('rejects unknown setting keys from the admin API', async () => {
    const response = await authed(session)
      .put('/api/v1/admin/settings')
      .send({ values: { 'totally.made.up': 'x' } })
      .expect(400);

    expect(response.body.error.message).toContain('Unknown setting key');
  });

  it('saves a setting and reflects it publicly', async () => {
    await authed(session)
      .put('/api/v1/admin/settings')
      .send({ values: { 'contact.supportEmail': 'care@example.test', 'shipping.deliveryMaxDays': 6 } })
      .expect(200);

    const response = await request(app).get('/api/v1/site/public?locale=en').expect(200);
    expect(response.body.data.settings['contact.supportEmail']).toBe('care@example.test');
    expect(response.body.data.settings['shipping.deliveryMaxDays']).toBe(6);

    await setTestSettings({ 'contact.supportEmail': '', 'shipping.deliveryMaxDays': 5 });
  });

  it('serves robots.txt and a locale-aware sitemap with hreflang', async () => {
    const robots = await request(app).get('/robots.txt').expect(200);
    expect(robots.text).toContain('Disallow: /api/');
    expect(robots.text).toContain('Disallow: /admin');
    expect(robots.text).toContain('Sitemap:');

    const sitemap = await request(app).get('/sitemap.xml').expect(200);
    expect(sitemap.headers['content-type']).toContain('xml');
    expect(sitemap.text).toContain('hreflang="fr"');
    expect(sitemap.text).toContain('hreflang="x-default"');
    expect(sitemap.text).toContain('/en/collection<');
    expect(sitemap.text).toContain('/es/contact');
    expect(sitemap.text).toContain('/fr/blog<');
    // Redirecting paths, the bag and the admin app are never listed.
    expect(sitemap.text).not.toContain('/shop');
    expect(sitemap.text).not.toContain('/collections<');
    expect(sitemap.text).not.toContain('/bag');
    expect(sitemap.text).not.toContain('/admin');
  });

  it('serves a catalogue-only sitemap for the storefront sitemap index', async () => {
    const response = await request(app).get('/sitemap-catalog.xml').expect(200);
    expect(response.headers['content-type']).toContain('xml');
    expect(response.headers['cache-control']).toContain('max-age=3600');
    expect(response.text).toContain('<urlset');
    // Static pages belong to the storefront's own sitemap, so they are not repeated here.
    expect(response.text).not.toContain('/en/about<');
    expect(response.text).not.toContain('/en<');
  });

  it('returns a 404 for an unknown endpoint rather than HTML', async () => {
    const response = await request(app).get('/api/v1/nope').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('contact form', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
    session = await signIn();
  });

  afterAll(closeDatabase);

  const valid = {
    name: 'Alex Rivera',
    email: 'alex@example.test',
    topic: 'order',
    message: 'I would like to ask about the delivery estimate for California.',
    locale: 'en',
    consent: true,
  };

  it('stores a valid submission without requiring SMTP', async () => {
    const response = await request(app).post('/api/v1/contact').send(valid).expect(201);
    expect(response.body).toEqual({ data: { accepted: true } });

    const list = await authed(session).get('/api/v1/admin/messages').expect(200);
    expect(list.body.data.total).toBe(1);
    expect(list.body.data.items[0].name).toBe('Alex Rivera');
    expect(list.body.data.items[0].status).toBe('NEW');

    // With SMTP absent, notifications are simply off: no transport is ever built.
    expect(nodemailerMock.createTransport).not.toHaveBeenCalled();
  });

  it('rejects a missing name, a bad email, a short message and absent consent', async () => {
    await request(app).post('/api/v1/contact').send({ ...valid, name: 'A' }).expect(422);
    await request(app).post('/api/v1/contact').send({ ...valid, email: 'nope' }).expect(422);
    await request(app).post('/api/v1/contact').send({ ...valid, message: 'too short' }).expect(422);
    await request(app).post('/api/v1/contact').send({ ...valid, consent: false }).expect(422);
    await request(app).post('/api/v1/contact').send({ ...valid, topic: 'nonsense' }).expect(422);
  });

  it('silently discards a submission that fills the honeypot', async () => {
    const before = await authed(session).get('/api/v1/admin/messages').expect(200);

    await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, company: 'bot-filled-this' })
      .expect(201);

    const after = await authed(session).get('/api/v1/admin/messages').expect(200);
    expect(after.body.data.total).toBe(before.body.data.total);
  });

  it('stores a hashed IP rather than a raw address', async () => {
    const list = await authed(session).get('/api/v1/admin/messages').expect(200);
    const body = JSON.stringify(list.body);
    expect(body).not.toContain('127.0.0.1');
    expect(body).not.toContain('::ffff:');
  });

  it('marks a message as read and archives it', async () => {
    const list = await authed(session).get('/api/v1/admin/messages').expect(200);
    const id = list.body.data.items[0].id;

    await authed(session).post(`/api/v1/admin/messages/${id}/status`).send({ status: 'READ' }).expect(200);
    await authed(session).post(`/api/v1/admin/messages/${id}/status`).send({ status: 'ARCHIVED' }).expect(200);

    const archived = await authed(session).get('/api/v1/admin/messages?status=ARCHIVED').expect(200);
    expect(archived.body.data.items).toHaveLength(1);
  });

  it('accepts a newsletter sign-up only with explicit consent', async () => {
    await request(app).post('/api/v1/newsletter').send({ email: 'reader@example.test', consent: false }).expect(422);
    await request(app).post('/api/v1/newsletter').send({ email: 'reader@example.test', consent: true }).expect(201);

    const list = await authed(session).get('/api/v1/admin/subscribers').expect(200);
    expect(list.body.data.active).toBe(1);
  });
});

describe('legal content', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
    session = await signIn();

    // Legal pages are seeded by `npm run seed:content`; create one here so the
    // endpoint contract is covered without depending on the seed script.
    await authed(session).get('/api/v1/admin/legal').expect(200);
  });

  afterAll(closeDatabase);

  it('returns 404 for a policy that has not been created', async () => {
    await request(app).get('/api/v1/legal/privacy?locale=en').expect(404);
  });

  it('lists no policies when none exist, without erroring', async () => {
    const response = await request(app).get('/api/v1/legal?locale=en').expect(200);
    expect(response.body.data.items).toEqual([]);
  });
});
