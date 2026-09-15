import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { MailDeliveryError, sendMail } from '../../lib/mailer.js';
import { getSettings } from '../settings/service.js';

/** A contact message that has already been saved to the database. */
export interface ContactNotificationInput {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  locale: string;
  createdAt: Date;
}

/** The storefront's own English wording for each topic (frontend `contact.topics`). */
const TOPIC_LABELS: Record<string, string> = {
  order: 'An order',
  product: 'A fragrance',
  shipping: 'Delivery',
  returns: 'A return',
  wholesale: 'Wholesale or stockist',
  other: 'Something else',
};

const LOCALE_LABELS: Record<string, string> = { en: 'English', fr: 'French', es: 'Spanish' };

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Every visitor-supplied value goes through this before it is placed in HTML. */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

const isControlCharacter = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return code < 32 || code === 127;
};

/** Collapses control characters and line breaks, so a value can never span lines in a header. */
const singleLine = (value: string): string =>
  Array.from(value, (char) => (isControlCharacter(char) ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

const formatSubmittedAt = (date: Date): string => {
  const dubai = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Dubai',
  }).format(date);
  return `${dubai} Dubai time (${date.toISOString()})`;
};

const COLORS = {
  ground: '#f4f0e8',
  card: '#ffffff',
  hairline: '#e3dccf',
  black: '#070707',
  gold: '#c5a253',
  goldInk: '#7a5c2a',
  neutral: '#aaa298',
  text: '#19191b',
  muted: '#6b645a',
  panel: '#faf8f3',
};

const SANS = "Arial, Helvetica, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

export const renderContactNotification = (input: ContactNotificationInput) => {
  const name = singleLine(input.name);
  const email = singleLine(input.email);
  const phone = input.phone ? singleLine(input.phone) : null;
  const topic = TOPIC_LABELS[input.topic] ?? input.topic;
  const language = LOCALE_LABELS[input.locale] ?? input.locale;
  const submittedAt = formatSubmittedAt(input.createdAt);
  const reference = `#${input.id}`;
  const message = input.message.replace(/\r\n|\r/g, '\n');

  const link = (href: string, label: string) =>
    `<a href="${escapeHtml(href)}" style="color:${COLORS.goldInk};text-decoration:underline;">${escapeHtml(label)}</a>`;

  const fields: Array<{ label: string; text: string; html: string }> = [
    { label: 'Name', text: name, html: escapeHtml(name) },
    { label: 'Email', text: email, html: link(`mailto:${email}`, email) },
    ...(phone ? [{ label: 'Phone', text: phone, html: link(`tel:${phone.replace(/[^+\d]/g, '')}`, phone) }] : []),
    { label: 'Topic', text: topic, html: escapeHtml(topic) },
    { label: 'Language', text: language, html: escapeHtml(language) },
    { label: 'Submitted', text: submittedAt, html: escapeHtml(submittedAt) },
    { label: 'Reference', text: reference, html: escapeHtml(reference) },
  ];

  const subject = `New Mian Dubai Enquiry — ${name}`;

  const text = [
    'New enquiry from the Mian Dubai website',
    '',
    ...fields.map((field) => `${field.label}: ${field.text}`),
    '',
    'Message:',
    message,
    '',
    '—',
    `Reply to this email to answer ${name} directly.`,
    `This enquiry is also saved in the website database as ${reference}.`,
  ].join('\n');

  const rows = fields
    .map(
      (field) => `
              <tr>
                <td valign="top" style="padding:9px 16px 9px 0;width:110px;border-bottom:1px solid ${COLORS.ground};font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.goldInk};">${escapeHtml(field.label)}</td>
                <td valign="top" style="padding:9px 0;border-bottom:1px solid ${COLORS.ground};font-family:${SANS};font-size:15px;line-height:1.5;color:${COLORS.text};word-break:break-word;">${field.html}</td>
              </tr>`,
    )
    .join('');

  const messageHtml = escapeHtml(message).replace(/\n/g, '<br>');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.ground};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(`New enquiry from ${name} — ${topic}`)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.ground};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${COLORS.card};border:1px solid ${COLORS.hairline};">
          <tr>
            <td style="background:${COLORS.black};padding:26px 32px;border-bottom:2px solid ${COLORS.gold};">
              <div style="font-family:${SERIF};font-size:20px;letter-spacing:6px;color:${COLORS.gold};">MIAN DUBAI</div>
              <div style="padding-top:6px;font-family:${SANS};font-size:13px;letter-spacing:1px;color:${COLORS.neutral};">New website enquiry</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 4px;">
              <h1 style="margin:0 0 4px;font-family:${SERIF};font-size:24px;font-weight:normal;color:${COLORS.black};">${escapeHtml(name)}</h1>
              <p style="margin:0;font-family:${SANS};font-size:14px;color:${COLORS.muted};">${escapeHtml(topic)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <div style="padding-bottom:8px;font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.goldInk};">Message</div>
              <div style="padding:16px 18px;background:${COLORS.panel};border-left:3px solid ${COLORS.gold};font-family:${SANS};font-size:15px;line-height:1.6;color:${COLORS.text};word-break:break-word;">${messageHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid ${COLORS.hairline};font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.muted};">
              Reply to this email to answer ${escapeHtml(name)} directly at ${escapeHtml(email)}.<br>
              This enquiry is also saved in the website database as ${escapeHtml(reference)}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
};

// ---------------------------------------------------------------------------
// Customer acknowledgement
// ---------------------------------------------------------------------------

type AcknowledgementLocale = 'en' | 'fr' | 'es';

interface AcknowledgementCopy {
  subject: string;
  preheader: string;
  heading: string;
  received: string;
  urgent: string;
  whatsappCta: string;
  referenceLabel: string;
  topicLabel: string;
  footer: (site: string) => string;
  topics: Record<string, string>;
}

/** Short, personal and in the language the form was sent in. The topic labels match the storefront. */
const ACKNOWLEDGEMENT_COPY: Record<AcknowledgementLocale, AcknowledgementCopy> = {
  en: {
    subject: 'Thank you for contacting Mian Dubai',
    preheader: 'We have received your message and will reply personally.',
    heading: 'Thank you for contacting Mian Dubai.',
    received: 'We have received your message and a member of our team will reply personally.',
    urgent: 'For urgent enquiries, WhatsApp is the fastest way to reach us.',
    whatsappCta: 'Message us on WhatsApp',
    referenceLabel: 'Your reference',
    topicLabel: 'Regarding',
    footer: (site) =>
      `You are receiving this email because this address was entered in the contact form on ${site}. If that was not you, no action is needed.`,
    topics: TOPIC_LABELS,
  },
  fr: {
    subject: 'Merci d’avoir contacté Mian Dubai',
    preheader: 'Nous avons bien reçu votre message et vous répondrons personnellement.',
    heading: 'Merci d’avoir contacté Mian Dubai.',
    received: 'Nous avons bien reçu votre message ; un membre de notre équipe vous répondra personnellement.',
    urgent: 'Pour toute demande urgente, WhatsApp est le moyen le plus rapide de nous joindre.',
    whatsappCta: 'Nous écrire sur WhatsApp',
    referenceLabel: 'Votre référence',
    topicLabel: 'Objet',
    footer: (site) =>
      `Vous recevez cet e-mail car cette adresse a été saisie dans le formulaire de contact de ${site}. Si ce n’était pas vous, vous n’avez rien à faire.`,
    topics: {
      order: 'Une commande',
      product: 'Un parfum',
      shipping: 'La livraison',
      returns: 'Un retour',
      wholesale: 'Revente ou distribution',
      other: 'Autre chose',
    },
  },
  es: {
    subject: 'Gracias por contactar con Mian Dubai',
    preheader: 'Hemos recibido su mensaje y le responderemos personalmente.',
    heading: 'Gracias por contactar con Mian Dubai.',
    received: 'Hemos recibido su mensaje y un miembro de nuestro equipo le responderá personalmente.',
    urgent: 'Para consultas urgentes, WhatsApp es la forma más rápida de contactarnos.',
    whatsappCta: 'Escríbanos por WhatsApp',
    referenceLabel: 'Su referencia',
    topicLabel: 'Asunto',
    footer: (site) =>
      `Recibe este correo porque esta dirección se introdujo en el formulario de contacto de ${site}. Si no fue usted, no tiene que hacer nada.`,
    topics: {
      order: 'Un pedido',
      product: 'Una fragancia',
      shipping: 'La entrega',
      returns: 'Una devolución',
      wholesale: 'Mayorista o distribución',
      other: 'Otra cosa',
    },
  },
};

export interface AcknowledgementInput {
  id: number;
  topic: string;
  locale: string;
  /** A wa.me link built from the business's own number, or null when none is configured. */
  whatsappUrl: string | null;
  /** The storefront host named in the footer, e.g. miandubai.com. */
  siteHost: string;
}

/**
 * The confirmation a visitor receives after using the contact form.
 *
 * It deliberately repeats nothing the visitor typed — not the name, not the
 * message. The recipient address is whatever was entered in the form, so
 * echoing free text would let anyone send their own words to any inbox under
 * the Mian Dubai name. Only fixed copy, the topic label and the reference
 * number appear here.
 */
export const renderContactAcknowledgement = (input: AcknowledgementInput) => {
  const locale: AcknowledgementLocale = input.locale === 'fr' || input.locale === 'es' ? input.locale : 'en';
  const copy = ACKNOWLEDGEMENT_COPY[locale];
  const reference = `#${input.id}`;
  const topic = copy.topics[input.topic] ?? copy.topics.other ?? '';
  const footer = copy.footer(input.siteHost);

  const text = [
    copy.heading,
    '',
    copy.received,
    '',
    input.whatsappUrl ? `${copy.urgent} ${input.whatsappUrl}` : copy.urgent,
    '',
    `${copy.referenceLabel}: ${reference}`,
    `${copy.topicLabel}: ${topic}`,
    '',
    'Mian Dubai',
    '',
    '—',
    footer,
  ].join('\n');

  const detail = (label: string, value: string) => `
                <tr>
                  <td valign="top" style="padding:10px 16px 10px 0;width:140px;border-top:1px solid ${COLORS.ground};font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.goldInk};">${escapeHtml(label)}</td>
                  <td valign="top" style="padding:10px 0;border-top:1px solid ${COLORS.ground};font-family:${SANS};font-size:14px;line-height:1.5;color:${COLORS.text};">${escapeHtml(value)}</td>
                </tr>`;

  const button = input.whatsappUrl
    ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">
                <tr>
                  <td style="background:${COLORS.black};border:1px solid ${COLORS.gold};">
                    <a href="${escapeHtml(input.whatsappUrl)}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${COLORS.gold};text-decoration:none;">${escapeHtml(copy.whatsappCta)}</a>
                  </td>
                </tr>
              </table>`
    : '';

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.ground};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(copy.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.ground};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${COLORS.card};border:1px solid ${COLORS.hairline};">
          <tr>
            <td align="center" style="background:${COLORS.black};padding:30px 36px;border-bottom:2px solid ${COLORS.gold};">
              <div style="font-family:${SERIF};font-size:22px;letter-spacing:7px;color:${COLORS.gold};">MIAN DUBAI</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 8px;">
              <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:26px;font-weight:normal;line-height:1.3;color:${COLORS.black};">${escapeHtml(copy.heading)}</h1>
              <p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.7;color:${COLORS.text};">${escapeHtml(copy.received)}</p>
              <p style="margin:0 0 18px;font-family:${SANS};font-size:15px;line-height:1.7;color:${COLORS.text};">${escapeHtml(copy.urgent)}</p>${button}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${detail(copy.referenceLabel, reference)}${detail(copy.topicLabel, topic)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px 34px;">
              <p style="margin:0;font-family:${SERIF};font-size:18px;letter-spacing:1px;color:${COLORS.goldInk};">Mian Dubai</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px;border-top:1px solid ${COLORS.hairline};font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.muted};">${escapeHtml(footer)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: copy.subject, text, html };
};

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export type MailOutcome = 'sent' | 'failed' | 'skipped' | 'disabled';

export interface ContactDeliveryOutcome {
  /** The email to the team at CONTACT_NOTIFICATION_EMAIL. */
  notification: MailOutcome;
  /** The confirmation to the visitor's own address. */
  acknowledgement: MailOutcome;
}

/** Exactly one mailbox address: no display name, no list, nothing that could break a header. */
const SINGLE_ADDRESS = /^[^\s@,;:<>()"\\[\]]+@[^\s@,;:<>()"\\[\]]+\.[^\s@,;:<>()"\\[\]]+$/;

const whatsappLink = (raw: string | undefined): string | null => {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
};

const hostOf = (url: string | undefined): string => {
  try {
    return new URL(url ?? '').host || 'miandubai.com';
  } catch {
    return 'miandubai.com';
  }
};

/** Credentials are already redacted inside MailDeliveryError; nothing else about the mail is logged. */
const describeMailError = (error: unknown) =>
  error instanceof MailDeliveryError
    ? { message: error.message, code: error.code, responseCode: error.responseCode }
    : { message: 'The email could not be prepared.' };

const attempt = async (
  contactMessageId: number,
  send: () => Promise<void>,
  log: { sent: string; failed: string },
): Promise<MailOutcome> => {
  try {
    await send();
    logger.info({ contactMessageId }, log.sent);
    return 'sent';
  } catch (error) {
    logger.error({ contactMessageId, mailError: describeMailError(error) }, log.failed);
    return 'failed';
  }
};

/**
 * Sends both contact emails for a message that is ALREADY saved: the team
 * notification (Reply-To the visitor) and the visitor's acknowledgement
 * (Reply-To the Mian Dubai mailbox). They are independent — one failing never
 * stops or fails the other — and neither ever throws: the database row is the
 * permanent record, so a mail failure is logged (without credentials, the
 * visitor's address or their message) and reported in the outcome instead.
 */
export const deliverContactEmails = async (input: ContactNotificationInput): Promise<ContactDeliveryOutcome> => {
  const config = env.email;
  if (!config) return { notification: 'disabled', acknowledgement: 'disabled' };

  const settings = await getSettings().catch(() => null);
  const recipient = input.email.trim();

  const [notification, acknowledgement] = await Promise.all([
    attempt(
      input.id,
      () => sendMail({ to: config.contactNotificationEmail, replyTo: recipient, ...renderContactNotification(input) }),
      {
        sent: 'Contact notification email sent',
        failed: 'Contact notification email failed; the message is saved in the database',
      },
    ),
    SINGLE_ADDRESS.test(recipient)
      ? attempt(
          input.id,
          () =>
            sendMail({
              to: recipient,
              replyTo: config.fromEmail,
              ...renderContactAcknowledgement({
                id: input.id,
                topic: input.topic,
                locale: input.locale,
                whatsappUrl: whatsappLink(settings?.['contact.whatsappNumber']),
                siteHost: hostOf(settings?.['site.publicUrl'] || env.SITE_BASE_URL),
              }),
            }),
          {
            sent: 'Customer acknowledgement email sent',
            failed: 'Customer acknowledgement email failed; the team notification is unaffected',
          },
        )
      : Promise.resolve<MailOutcome>('skipped'),
  ]);

  return { notification, acknowledgement };
};
