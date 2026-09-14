import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { MailDeliveryError, sendMail } from '../../lib/mailer.js';

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

export type ContactNotificationOutcome = 'sent' | 'disabled' | 'failed';

/**
 * Emails the team about a contact message that is ALREADY saved. It never
 * throws: the database row is the permanent record, so a mail failure is
 * logged (without credentials or the customer's message) and the visitor
 * still gets the normal success response — telling them to resubmit would
 * only create a duplicate enquiry.
 */
export const notifyContactSubmission = async (input: ContactNotificationInput): Promise<ContactNotificationOutcome> => {
  const config = env.email;
  if (!config) return 'disabled';

  try {
    await sendMail({ to: config.contactNotificationEmail, replyTo: input.email, ...renderContactNotification(input) });
    logger.info({ contactMessageId: input.id }, 'Contact notification email sent');
    return 'sent';
  } catch (error) {
    const mailError =
      error instanceof MailDeliveryError
        ? { message: error.message, code: error.code, responseCode: error.responseCode }
        : { message: 'The notification email could not be prepared.' };
    logger.error(
      { contactMessageId: input.id, mailError },
      'Contact notification email failed; the message is saved in the database',
    );
    return 'failed';
  }
};
