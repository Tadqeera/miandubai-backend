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

  describe('CSRF token delivery for a cross-origin admin app', () => {
    /**
     * Production runs the admin app on admin.miandubai.com and the API on
     * api.miandubai.com. The browser sends both cookies with a credentialed
     * request, but the admin page cannot read the API's CSRF cookie through
     * document.cookie, so it used to send no header at all.
     */
    const sessionCookieOnly = (cookies: string[]) => cookies.filter((cookie) => !cookie.startsWith('mdb_csrf='));
    const csrfCookieFrom = (response: request.Response) =>
      ((response.headers['set-cookie'] as unknown as string[] | undefined) ?? [])
        .map((cookie) => cookie.split(';')[0]!)
        .find((cookie) => cookie.startsWith('mdb_csrf='));

    it('reproduces the production failure: a write that carries the cookies but no header is refused', async () => {
      const session = await signIn();

      const response = await request(app)
        .put('/api/v1/admin/settings')
        .set('Cookie', session.cookies)
        .send({ values: { 'contact.supportEmail': '' } })
        .expect(403);

      expect(response.body.error.code).toBe('CSRF_INVALID');
      expect(response.body.error.message).toBe('Missing CSRF token.');
    });

    it('returns the session CSRF token from /auth/me without the client reading any cookie', async () => {
      const session = await signIn();
      const response = await authed(session).get('/api/v1/admin/auth/me').expect(200);

      expect(response.body.data.csrfToken).toBe(session.csrfToken);
      expect(response.headers['cache-control']).toBe('no-store');
    });

    it('serves the token from /auth/csrf only to an authenticated session', async () => {
      const anonymous = await request(app).get('/api/v1/admin/auth/csrf').expect(401);
      expect(anonymous.body.data).toBeUndefined();

      const session = await signIn();
      const response = await authed(session).get('/api/v1/admin/auth/csrf').expect(200);
      expect(response.body.data.csrfToken).toBe(session.csrfToken);
      expect(response.headers['cache-control']).toBe('no-store');
    });

    it('lets protected mutations through with the delivered token', async () => {
      const session = await signIn();
      const { body } = await request(app).get('/api/v1/admin/auth/csrf').set('Cookie', session.cookies).expect(200);

      await request(app)
        .put('/api/v1/admin/settings')
        .set('Cookie', session.cookies)
        .set('X-CSRF-Token', body.data.csrfToken)
        .send({ values: { 'contact.supportEmail': '' } })
        .expect(200);

      // A delete for a missing record gets past the CSRF guard and fails on its own merits.
      await request(app)
        .delete('/api/v1/admin/media/999999')
        .set('Cookie', session.cookies)
        .set('X-CSRF-Token', body.data.csrfToken)
        .expect(404);
    });

    it('re-issues the CSRF cookie when a session has lost it, and the new pair authorises writes', async () => {
      const session = await signIn();
      const withoutCsrf = sessionCookieOnly(session.cookies);

      const response = await request(app).get('/api/v1/admin/auth/csrf').set('Cookie', withoutCsrf).expect(200);
      const reissued = csrfCookieFrom(response);
      expect(reissued).toBe(`mdb_csrf=${response.body.data.csrfToken}`);

      await request(app)
        .put('/api/v1/admin/settings')
        .set('Cookie', [...withoutCsrf, reissued!])
        .set('X-CSRF-Token', response.body.data.csrfToken)
        .send({ values: { 'contact.supportEmail': '' } })
        .expect(200);
    });

    it('still refuses a token that does not match the cookie, with a code the client can act on', async () => {
      const session = await signIn();

      const response = await authed({ ...session, csrfToken: `${session.csrfToken.slice(0, -1)}x` })
        .put('/api/v1/admin/settings')
        .send({ values: { 'contact.supportEmail': '' } })
        .expect(403);

      expect(response.body.error.code).toBe('CSRF_INVALID');
      expect(response.body.error.message).toBe('Invalid CSRF token.');
    });

    it('checks the session before the CSRF token, so a signed-out write is still a 401', async () => {
      await request(app)
        .post('/api/v1/admin/products')
        .set('X-CSRF-Token', 'anything')
        .send({ sku: 'CSRF-3', priceUsd: '10.00', translations: [{ locale: 'en', name: 'x' }] })
        .expect(401);
    });

    it('requires the token for sign-out as well', async () => {
      const session = await signIn();
      const response = await request(app).post('/api/v1/admin/auth/logout').set('Cookie', session.cookies).expect(403);
      expect(response.body.error.code).toBe('CSRF_INVALID');
    });
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
