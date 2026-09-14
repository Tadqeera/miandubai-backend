import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { EMAIL_VARIABLES, parseEnvironment } from '../src/config/env.js';
import { logger } from '../src/lib/logger.js';
import { prisma } from '../src/lib/prisma.js';
import { escapeHtml, renderContactNotification } from '../src/modules/contact/notification.js';
import { app, closeDatabase, resetDatabase } from './helpers.js';

// Placeholder values only — real credentials never belong in tests. vi.hoisted
// runs before the imports above, so src/config/env.ts parses these values.
const SMTP = vi.hoisted(() => {
  const values = {
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '465',
    SMTP_SECURE: 'true',
    SMTP_USER: 'mailbox@example.test',
    SMTP_PASSWORD: 'placeholder-smtp-password-000',
    SMTP_FROM_EMAIL: 'mailbox@example.test',
    SMTP_FROM_NAME: 'Mian Dubai Website',
    CONTACT_NOTIFICATION_EMAIL: 'notifications@example.test',
  };
  for (const [name, value] of Object.entries(values)) vi.stubEnv(name, value);
  return values;
});

// Nodemailer is mocked, so no test can ever reach a real mail server.
const nodemailerMock = vi.hoisted(() => {
  const sendMail = vi.fn();
  const createTransport = vi.fn(() => ({ sendMail }));
  return { sendMail, createTransport };
});

vi.mock('nodemailer', () => ({
  default: { createTransport: nodemailerMock.createTransport },
  createTransport: nodemailerMock.createTransport,
}));

const BASE_ENV = {
  DATABASE_URL: 'mysql://root:@127.0.0.1:3306/miandubai_test',
  AUTH_JWT_SECRET: 'test-secret-value-that-is-long-enough-for-validation',
  MEDIA_ROOT: '../.miandubai-test-media',
};

const errorMessageOf = (run: () => unknown): string => {
  try {
    run();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

describe('contact notification email configuration', () => {
  it('switches notifications off, without error, when no SMTP variable is set', () => {
    expect(parseEnvironment(BASE_ENV).email).toBeNull();

    const blank = Object.fromEntries(EMAIL_VARIABLES.map((name) => [name, '']));
    expect(parseEnvironment({ ...BASE_ENV, ...blank }).email).toBeNull();
  });

  it('parses a complete Hostinger configuration', () => {
    expect(parseEnvironment({ ...BASE_ENV, ...SMTP }).email).toEqual({
      host: 'smtp.example.test',
      port: 465,
      secure: true,
      user: SMTP.SMTP_USER,
      password: SMTP.SMTP_PASSWORD,
      fromEmail: SMTP.SMTP_FROM_EMAIL,
      fromName: 'Mian Dubai Website',
      contactNotificationEmail: SMTP.CONTACT_NOTIFICATION_EMAIL,
    });

    const starttls = parseEnvironment({ ...BASE_ENV, ...SMTP, SMTP_PORT: '587', SMTP_SECURE: 'FALSE' }).email;
    expect(starttls).toMatchObject({ port: 587, secure: false });
  });

  it('refuses a partial configuration and names only the missing variables', () => {
    const message = errorMessageOf(() =>
      parseEnvironment({ ...BASE_ENV, SMTP_HOST: SMTP.SMTP_HOST, SMTP_PASSWORD: SMTP.SMTP_PASSWORD }),
    );

    for (const name of EMAIL_VARIABLES.filter((variable) => variable !== 'SMTP_HOST' && variable !== 'SMTP_PASSWORD')) {
      expect(message).toContain(`${name} is required when any SMTP_* or CONTACT_NOTIFICATION_EMAIL variable is set`);
    }
    expect(message).not.toContain('SMTP_HOST is required');
    expect(message).not.toContain('SMTP_PASSWORD is required');
    expect(message).not.toContain(SMTP.SMTP_PASSWORD);
    expect(message).not.toContain(SMTP.SMTP_HOST);
  });

  it('refuses a configuration missing any single variable, without echoing any value', () => {
    for (const missing of EMAIL_VARIABLES) {
      const message = errorMessageOf(() => parseEnvironment({ ...BASE_ENV, ...SMTP, [missing]: '' }));

      expect(message).toContain(`${missing} is required`);
      for (const value of Object.values(SMTP)) {
        expect(message).not.toContain(value);
      }
    }
  });

  it('rejects an invalid port, secure flag or address without echoing the value', () => {
    const port = errorMessageOf(() => parseEnvironment({ ...BASE_ENV, ...SMTP, SMTP_PORT: '99999' }));
    expect(port).toContain('SMTP_PORT must be a whole number between 1 and 65535');
    expect(port).not.toContain('99999');

    expect(errorMessageOf(() => parseEnvironment({ ...BASE_ENV, ...SMTP, SMTP_PORT: '465abc' }))).toContain(
      'SMTP_PORT must be a whole number',
    );

    const secure = errorMessageOf(() => parseEnvironment({ ...BASE_ENV, ...SMTP, SMTP_SECURE: 'sometimes' }));
    expect(secure).toContain('SMTP_SECURE must be "true" or "false"');
    expect(secure).not.toContain('sometimes');

    const address = errorMessageOf(() =>
      parseEnvironment({ ...BASE_ENV, ...SMTP, CONTACT_NOTIFICATION_EMAIL: 'not-an-address' }),
    );
    expect(address).toContain('CONTACT_NOTIFICATION_EMAIL must be a valid email address');
    expect(address).not.toContain('not-an-address');
    expect(address).not.toContain(SMTP.SMTP_PASSWORD);
  });
});

describe('contact notification content', () => {
  const base = {
    id: 42,
    name: 'Alex Rivera',
    email: 'alex@example.test',
    phone: '+971 50 000 0000',
    topic: 'wholesale',
    message: 'Hello',
    locale: 'fr',
    createdAt: new Date('2026-09-14T10:00:00.000Z'),
  };

  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });

  it('escapes visitor-controlled HTML and keeps the message line breaks', () => {
    const { html, text } = renderContactNotification({
      ...base,
      name: '<b>Alex</b> "Rivera"',
      message: 'Hello <script>alert("x")</script>\nSecond line & more\r\nThird <img src=x onerror=alert(1)>',
    });

    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>Alex');
    expect(html).toContain('&lt;b&gt;Alex&lt;/b&gt; &quot;Rivera&quot;');
    expect(html).toContain(
      'Hello &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;<br>Second line &amp; more<br>Third &lt;img src=x onerror=alert(1)&gt;',
    );

    // The plain-text part carries the message as written, with normalised line endings.
    expect(text).toContain('Hello <script>alert("x")</script>\nSecond line & more\nThird <img');
  });

  it('shows only the fields the contact form captures', () => {
    const { html, text, subject } = renderContactNotification(base);

    expect(subject).toBe('New Mian Dubai Enquiry — Alex Rivera');
    for (const expected of [
      'Name: Alex Rivera',
      'Email: alex@example.test',
      'Phone: +971 50 000 0000',
      'Topic: Wholesale or stockist',
      'Language: French',
      'Reference: #42',
      '2026-09-14T10:00:00.000Z',
    ]) {
      expect(text).toContain(expected);
    }
    expect(html).toContain('href="mailto:alex@example.test"');
    expect(html).toContain('href="tel:+971500000000"');
    expect(html).toContain('Wholesale or stockist');
  });

  it('omits the phone row when none was given and keeps the subject on one line', () => {
    const { html, text, subject } = renderContactNotification({
      ...base,
      name: 'Alex\r\nBcc: someone@example.test',
      phone: null,
    });

    expect(subject).toBe('New Mian Dubai Enquiry — Alex Bcc: someone@example.test');
    expect(subject).not.toMatch(/[\r\n]/);
    expect(text).not.toContain('Phone:');
    expect(html).not.toContain('tel:');
  });
});

describe('contact form notification email', () => {
  const valid = {
    name: 'Alex Rivera',
    email: 'alex@example.test',
    phone: '+1 555 010 0000',
    topic: 'order',
    message: 'I would like to ask about the delivery estimate for California.',
    locale: 'en',
    consent: true,
  };

  /** vi.spyOn spies to undo after each test. vi.restoreAllMocks would also wipe the nodemailer call history. */
  const spies: Array<{ mockRestore: () => void }> = [];

  beforeAll(resetDatabase);

  beforeEach(() => {
    nodemailerMock.sendMail.mockReset();
    nodemailerMock.sendMail.mockResolvedValue({ messageId: '<test@example.test>' });
  });

  afterEach(() => {
    spies.splice(0).forEach((spy) => spy.mockRestore());
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await closeDatabase();
  });

  it('saves the message, then sends exactly one notification from the configured mailbox', async () => {
    const response = await request(app).post('/api/v1/contact').send(valid).expect(201);
    expect(response.body).toEqual({ data: { accepted: true } });

    const rows = await prisma.contactMessage.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Alex Rivera', email: 'alex@example.test', topic: 'order', status: 'NEW' });

    expect(nodemailerMock.sendMail).toHaveBeenCalledTimes(1);
    const mail = nodemailerMock.sendMail.mock.calls[0]?.[0];
    expect(mail).toMatchObject({
      from: { name: SMTP.SMTP_FROM_NAME, address: SMTP.SMTP_FROM_EMAIL },
      to: SMTP.CONTACT_NOTIFICATION_EMAIL,
      replyTo: valid.email,
      subject: 'New Mian Dubai Enquiry — Alex Rivera',
    });
    expect(mail.text).toContain(valid.message);
    expect(mail.text).toContain(`Reference: #${rows[0]!.id}`);
    expect(mail.html).toContain('Alex Rivera');

    expect(nodemailerMock.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: SMTP.SMTP_HOST,
        port: 465,
        secure: true,
        auth: { user: SMTP.SMTP_USER, pass: SMTP.SMTP_PASSWORD },
      }),
    );
  });

  it('reuses one transporter rather than creating one per request', async () => {
    await request(app).post('/api/v1/contact').send(valid).expect(201);

    expect(nodemailerMock.sendMail).toHaveBeenCalledTimes(1);
    expect(nodemailerMock.createTransport).toHaveBeenCalledTimes(1);
  });

  it('escapes visitor HTML in the delivered email', async () => {
    await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, name: '<script>alert(1)</script>', message: '<img src=x onerror=alert(1)>\nline two of the note' })
      .expect(201);

    const mail = nodemailerMock.sendMail.mock.calls[0]?.[0];
    expect(mail.html).not.toContain('<script');
    expect(mail.html).not.toContain('<img');
    expect(mail.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(mail.html).toContain('&lt;img src=x onerror=alert(1)&gt;<br>line two of the note');
  });

  it('sends nothing for a honeypot submission, which is never stored', async () => {
    const before = await prisma.contactMessage.count();
    await request(app).post('/api/v1/contact').send({ ...valid, company: 'bot-filled-this' }).expect(201);

    expect(await prisma.contactMessage.count()).toBe(before);
    expect(nodemailerMock.sendMail).not.toHaveBeenCalled();
  });

  it('keeps the saved message and still answers 201 when SMTP delivery fails, logging no secrets', async () => {
    const authPlain = Buffer.from(`\u0000${SMTP.SMTP_USER}\u0000${SMTP.SMTP_PASSWORD}`).toString('base64');
    nodemailerMock.sendMail.mockRejectedValueOnce(
      Object.assign(
        new Error(`Invalid login: 535 5.7.8 authentication failed for ${SMTP.SMTP_USER} ${SMTP.SMTP_PASSWORD} ${authPlain}`),
        { code: 'EAUTH', responseCode: 535, command: 'AUTH PLAIN' },
      ),
    );
    const errorLog = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    spies.push(errorLog);
    const customerMessage = 'Please call me back about wholesale pricing for my boutique.';
    const before = await prisma.contactMessage.count();

    const response = await request(app).post('/api/v1/contact').send({ ...valid, message: customerMessage }).expect(201);

    expect(response.body).toEqual({ data: { accepted: true } });
    expect(nodemailerMock.sendMail).toHaveBeenCalledTimes(1);

    expect(await prisma.contactMessage.count()).toBe(before + 1);
    const saved = await prisma.contactMessage.findFirst({ where: { message: customerMessage } });
    expect(saved).not.toBeNull();
    expect(saved?.status).toBe('NEW');

    expect(errorLog).toHaveBeenCalledTimes(1);
    const [payload, text] = errorLog.mock.calls[0] as unknown as [Record<string, unknown>, string];
    expect(text).toContain('the message is saved in the database');
    expect(payload).toMatchObject({ contactMessageId: saved!.id, mailError: { code: 'EAUTH', responseCode: 535 } });

    const logged = JSON.stringify(errorLog.mock.calls);
    expect(logged).toContain('[redacted]');
    expect(logged).not.toContain(SMTP.SMTP_PASSWORD);
    expect(logged).not.toContain(SMTP.SMTP_USER);
    expect(logged).not.toContain(authPlain);
    expect(logged).not.toContain(customerMessage);
  });

  it('keeps the existing failure response when the database write fails, and sends no email', async () => {
    spies.push(vi.spyOn(prisma.contactMessage, 'create').mockRejectedValueOnce(new Error('Database unavailable')));
    const before = await prisma.contactMessage.count();

    const response = await request(app).post('/api/v1/contact').send(valid).expect(500);

    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(nodemailerMock.sendMail).not.toHaveBeenCalled();
    expect(await prisma.contactMessage.count()).toBe(before);
  });
});
