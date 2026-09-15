import type { ContactStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { SUPPORTED_LOCALES } from '../../lib/locale.js';
import { deliverContactEmails } from './notification.js';

export const CONTACT_TOPICS = ['order', 'product', 'shipping', 'returns', 'wholesale', 'other'] as const;

export const contactSubmitSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(191),
  phone: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      const text = (value ?? '').trim();
      return text === '' ? null : text.slice(0, 40);
    })
    .refine((value) => value === null || /^[+()\d\s-]{6,40}$/.test(value), 'Please enter a valid telephone number.'),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(10, 'Please tell us a little more.').max(5000),
  locale: z.enum(SUPPORTED_LOCALES).optional().default('en'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm you agree to be contacted.' }) }),
  /** Honeypot — must stay empty. Bots fill every field they find. */
  company: z.string().max(200).optional(),
});

export type ContactSubmitInput = z.infer<typeof contactSubmitSchema>;

export const submitContactMessage = async (
  input: ContactSubmitInput,
  meta: { ipHash: string; userAgent?: string },
) => {
  if (input.company && input.company.trim() !== '') {
    // Silently accept so the bot has nothing to learn — the same answer a real
    // submission would get — but store and send nothing.
    return { id: null, accepted: true, confirmationEmailSent: env.email !== null };
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      topic: input.topic,
      message: input.message,
      locale: input.locale,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
    },
    select: { id: true, createdAt: true },
  });

  // Only once the row is saved, and never in the same transaction: a mail
  // failure is logged inside and can neither undo nor fail the submission.
  // Awaited because a serverless function may be frozen as soon as the
  // response is sent, which would silently drop a fire-and-forget email.
  const delivery = await deliverContactEmails({
    id: message.id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    topic: input.topic,
    message: input.message,
    locale: input.locale,
    createdAt: message.createdAt,
  });

  // The storefront only mentions a confirmation email when one really went out.
  return { id: message.id, accepted: true, confirmationEmailSent: delivery.acknowledgement === 'sent' };
};

export const listContactMessages = async (params: { page: number; pageSize: number; status?: ContactStatus }) => {
  const where: Prisma.ContactMessageWhereInput = params.status ? { status: params.status } : {};

  const [items, total, unread] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      topic: item.topic,
      message: item.message,
      locale: item.locale,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      readAt: item.readAt?.toISOString() ?? null,
    })),
    total,
    unread,
    page: params.page,
    pageSize: params.pageSize,
  };
};

export const setContactStatus = async (id: number, status: ContactStatus) => {
  const existing = await prisma.contactMessage.findUnique({ where: { id }, select: { id: true, readAt: true } });
  if (!existing) throw ApiError.notFound('Message not found.');

  return prisma.contactMessage.update({
    where: { id },
    data: {
      status,
      readAt: status === 'NEW' ? null : existing.readAt ?? new Date(),
    },
    select: { id: true, status: true },
  });
};

export const getRecentMessages = (limit = 5) =>
  prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, name: true, topic: true, status: true, createdAt: true },
  });
