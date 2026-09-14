import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, authed, closeDatabase, createTestAdmin, resetDatabase, signIn, TEST_ADMIN } from './helpers.js';

describe('admin authentication', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createTestAdmin();
  });

  afterAll(closeDatabase);

  it('signs in with correct credentials and issues httpOnly session + readable CSRF cookies', async () => {
    const response = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
      .expect(200);

    expect(response.body.data.admin.email).toBe(TEST_ADMIN.email);
    expect(response.body.data.csrfToken).toBeTruthy();

    const cookies = response.headers['set-cookie'] as unknown as string[];
    const session = cookies.find((cookie) => cookie.startsWith('mdb_admin_session='));
    const csrf = cookies.find((cookie) => cookie.startsWith('mdb_csrf='));

    expect(session).toMatch(/HttpOnly/i);
    expect(csrf).not.toMatch(/HttpOnly/i);
  });

  it('never returns the password hash', async () => {
    const response = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
      .expect(200);

    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('$argon2');
  });

  it('rejects a wrong password with the same message as an unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'not-the-password' })
      .expect(401);

    const unknownEmail = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'nobody@miandubai.test', password: 'not-the-password' })
      .expect(401);

    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it('rejects a malformed email with a validation error', async () => {
    const response = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'not-an-email', password: 'whatever' })
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('refuses protected routes without a session', async () => {
    await request(app).get('/api/v1/admin/products').expect(401);
    await request(app).get('/api/v1/admin/dashboard').expect(401);
  });

  it('returns the signed-in administrator from /auth/me', async () => {
    const session = await signIn();
    const response = await authed(session).get('/api/v1/admin/auth/me').expect(200);
    expect(response.body.data.admin.email).toBe(TEST_ADMIN.email);
  });

  it('rejects a state-changing request that omits the CSRF header', async () => {
    const session = await signIn();

    await request(app)
      .post('/api/v1/admin/products')
      .set('Cookie', session.cookies)
      .send({ sku: 'CSRF-1', priceUsd: '10.00', translations: [{ locale: 'en', name: 'x' }] })
      .expect(403);
  });

  it('rejects a CSRF header that does not match the cookie', async () => {
    const session = await signIn();

    await request(app)
      .post('/api/v1/admin/products')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', 'a-forged-token')
      .send({ sku: 'CSRF-2', priceUsd: '10.00', translations: [{ locale: 'en', name: 'x' }] })
      .expect(403);
  });

  it('clears the session on logout', async () => {
    const session = await signIn();
    const response = await authed(session).post('/api/v1/admin/auth/logout').expect(200);

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((cookie) => cookie.startsWith('mdb_admin_session=;'))).toBe(true);
  });

  it('records login attempts in the audit log without storing the password', async () => {
    await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'wrong-on-purpose' })
      .expect(401);

    const session = await signIn();
    const response = await authed(session).get('/api/v1/admin/audit').expect(200);

    const actions = response.body.data.items.map((entry: { action: string }) => entry.action);
    expect(actions).toContain('ADMIN_LOGIN');
    expect(actions).toContain('ADMIN_LOGIN_FAILED');
    expect(JSON.stringify(response.body)).not.toContain('wrong-on-purpose');
  });
});
