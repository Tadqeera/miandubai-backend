import type { Express } from 'express';
import request from 'supertest';
import sharp from 'sharp';
import argon2 from 'argon2';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { ensureSettingRows, invalidateSettingsCache, updateSettings } from '../src/modules/settings/service.js';
import { CSRF_COOKIE_NAME } from '../src/modules/auth/tokens.js';

export const app: Express = createApp();

/** Truncation order respects foreign keys. */
export const resetDatabase = async () => {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'product_images',
    'product_translations',
    'product_categories',
    'product_collections',
    'products',
    'media_assets',
    'category_translations',
    'categories',
    'collection_translations',
    'collections',
    'site_content_translations',
    'site_contents',
    'legal_page_translations',
    'legal_pages',
    'contact_messages',
    'whatsapp_interactions',
    'newsletter_subscribers',
    'audit_logs',
    'admin_users',
    'site_settings',
  ]) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  invalidateSettingsCache();
  await ensureSettingRows();
};

export const TEST_ADMIN = {
  email: 'tester@miandubai.test',
  password: 'Test-Password-2026!',
  displayName: 'Test Administrator',
};

export const createTestAdmin = async () =>
  prisma.adminUser.create({
    data: {
      email: TEST_ADMIN.email,
      displayName: TEST_ADMIN.displayName,
      passwordHash: await argon2.hash(TEST_ADMIN.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      }),
      role: 'OWNER',
    },
  });

export interface Session {
  cookies: string[];
  csrfToken: string;
}

/** Signs in and returns the cookie jar plus the CSRF token to echo back. */
export const signIn = async (): Promise<Session> => {
  const response = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
    .expect(200);

  const raw = response.headers['set-cookie'];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const csrfCookie = cookies.find((cookie) => cookie.startsWith(`${CSRF_COOKIE_NAME}=`));
  const csrfToken = csrfCookie ? decodeURIComponent(csrfCookie.split(';')[0]!.split('=')[1] ?? '') : '';

  return { cookies: cookies.map((cookie) => cookie.split(';')[0]!), csrfToken };
};

/** Attaches the session cookies and CSRF header to a supertest request. */
export const authed = (session: Session) => ({
  get: (url: string) => request(app).get(url).set('Cookie', session.cookies),
  post: (url: string) =>
    request(app).post(url).set('Cookie', session.cookies).set('X-CSRF-Token', session.csrfToken),
  put: (url: string) => request(app).put(url).set('Cookie', session.cookies).set('X-CSRF-Token', session.csrfToken),
  delete: (url: string) =>
    request(app).delete(url).set('Cookie', session.cookies).set('X-CSRF-Token', session.csrfToken),
});

/**
 * A real PNG generated at runtime. Fixtures like this exist only in the test
 * environment — no demo product data is ever created in the app database.
 */
export const makeTestImage = async (width = 1200, height = 1200, format: 'png' | 'jpeg' = 'png'): Promise<Buffer> => {
  const image = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 24, g: 24, b: 24, alpha: 1 },
    },
  });
  return format === 'png' ? image.png().toBuffer() : image.jpeg().toBuffer();
};

export const setTestSettings = (values: Record<string, unknown>) => updateSettings(values as never);

export const closeDatabase = () => prisma.$disconnect();
