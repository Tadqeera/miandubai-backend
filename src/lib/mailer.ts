import nodemailer, { type Transporter } from 'nodemailer';
import { env, type EmailConfig } from '../config/env.js';

/**
 * Outgoing email through the configured SMTP mailbox (Hostinger in production).
 *
 * The transporter is created on the first send and then reused, so nothing
 * connects to the mail server at startup and a slow mail host can never stop
 * the API from booting. It is deliberately not pooled: a serverless instance
 * can be frozen between requests with a pooled socket left half-open.
 *
 * Credentials never leave this module, and every failure is rethrown as a
 * MailDeliveryError whose message has the credentials redacted.
 */

export interface OutgoingMail {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export class MailDeliveryError extends Error {
  /** Nodemailer's error code, e.g. EAUTH, ECONNECTION or ETIMEDOUT. */
  readonly code: string | undefined;
  /** The SMTP reply code, e.g. 535 when the mailbox rejects the credentials. */
  readonly responseCode: number | undefined;

  constructor(message: string, code?: string, responseCode?: number) {
    super(message);
    this.name = 'MailDeliveryError';
    this.code = code;
    this.responseCode = responseCode;
  }
}

// Nodemailer's defaults allow minutes; a stalled mail server must not hold a request open that long.
const TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };

let transporter: Transporter | undefined;

const getTransporter = (config: EmailConfig): Transporter => {
  transporter ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    ...TIMEOUTS,
  });
  return transporter;
};

/** Strips the mailbox login from text, including the base64 forms sent by AUTH LOGIN / AUTH PLAIN. */
const redact = (text: string, config: EmailConfig): string =>
  [
    config.password,
    config.user,
    Buffer.from(config.password).toString('base64'),
    Buffer.from(config.user).toString('base64'),
    Buffer.from(`\u0000${config.user}\u0000${config.password}`).toString('base64'),
  ]
    .filter((secret) => secret.length > 0)
    .reduce((result, secret) => result.split(secret).join('[redacted]'), text);

const toDeliveryError = (error: unknown, config: EmailConfig): MailDeliveryError => {
  const candidate = (typeof error === 'object' && error !== null ? error : {}) as {
    message?: unknown;
    code?: unknown;
    responseCode?: unknown;
  };
  const detail = typeof candidate.message === 'string' ? redact(candidate.message, config).slice(0, 300) : '';
  return new MailDeliveryError(
    `SMTP delivery failed${detail ? `: ${detail}` : ''}`,
    typeof candidate.code === 'string' ? candidate.code : undefined,
    typeof candidate.responseCode === 'number' ? candidate.responseCode : undefined,
  );
};

/** Sends one message from the configured mailbox. Throws MailDeliveryError on any failure. */
export const sendMail = async (mail: OutgoingMail): Promise<void> => {
  const config = env.email;
  if (!config) {
    throw new MailDeliveryError('Email is not configured.');
  }

  try {
    await getTransporter(config).sendMail({
      from: { name: config.fromName, address: config.fromEmail },
      to: mail.to,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      // Message content is never allowed to pull in local files or remote URLs.
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  } catch (error) {
    throw toDeliveryError(error, config);
  }
};
