import { WhatsAppSource } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { SUPPORTED_LOCALES } from '../../lib/locale.js';

/**
 * WhatsApp interaction tracking — deliberately honest.
 *
 * A `wa.me` link opens WhatsApp on the visitor's own device. It does NOT hand
 * this website their phone number, name or WhatsApp profile. So everything
 * recorded here is an *interaction*: someone pressed an ordering action, from
 * this page, in this language, for this product.
 *
 * `contactName` / `contactPhone` are written only when a visitor voluntarily
 * typed them into an optional pre-contact form. They stay null otherwise, and
 * the admin interface reports "Not provided" rather than inventing anything.
 */

const trimmedOptional = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) return null;
      const text = value.trim();
      return text === '' ? null : text.slice(0, max);
    });

export const whatsappEventSchema = z.object({
  source: z.nativeEnum(WhatsAppSource),
  productId: z
    .union([z.coerce.number().int().positive(), z.null()])
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  productSlug: trimmedOptional(191),
  productName: trimmedOptional(191),
  // A path, never a full URL — no query string, no fragment, no host.
  pagePath: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => {
      const path = (value ?? '/').split(/[?#]/)[0] ?? '/';
      return path.startsWith('/') ? path.slice(0, 300) : '/';
    }),
  locale: z.enum(SUPPORTED_LOCALES).optional().default('en'),
  currency: z.enum(['USD', 'AED']).optional().default('USD'),
  sessionId: trimmedOptional(64),
  contactName: trimmedOptional(120),
  contactPhone: trimmedOptional(40),
});

export type WhatsAppEventInput = z.infer<typeof whatsappEventSchema>;

export const recordWhatsAppInteraction = async (
  input: WhatsAppEventInput,
  ipHash: string | null,
): Promise<{ recorded: true }> => {
  await prisma.whatsAppInteraction.create({
    data: {
      source: input.source,
      productId: input.productId,
      productSlug: input.productSlug,
      productName: input.productName,
      pagePath: input.pagePath,
      locale: input.locale,
      currency: input.currency,
      sessionId: input.sessionId,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      ipHash,
    },
  });

  // The response carries nothing useful on purpose: this endpoint is fired
  // from a click handler and its result never changes what the visitor sees.
  return { recorded: true };
};

const since = (days: number): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
};

export interface WhatsAppActivityQuery {
  page: number;
  pageSize: number;
  source?: WhatsAppSource;
  range?: '1' | '7' | '30' | 'all';
}

export const getWhatsAppActivity = async (query: WhatsAppActivityQuery) => {
  const rangeDays = query.range === undefined || query.range === 'all' ? null : Number(query.range);

  const where = {
    ...(query.source ? { source: query.source } : {}),
    ...(rangeDays ? { createdAt: { gte: since(rangeDays) } } : {}),
  };

  const [total, rows, today, week, month, allTime, bySourceRaw, byProductRaw] = await Promise.all([
    prisma.whatsAppInteraction.count({ where }),
    prisma.whatsAppInteraction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.whatsAppInteraction.count({ where: { createdAt: { gte: since(1) } } }),
    prisma.whatsAppInteraction.count({ where: { createdAt: { gte: since(7) } } }),
    prisma.whatsAppInteraction.count({ where: { createdAt: { gte: since(30) } } }),
    prisma.whatsAppInteraction.count(),
    prisma.whatsAppInteraction.groupBy({ by: ['source'], _count: { _all: true } }),
    prisma.whatsAppInteraction.groupBy({
      by: ['productSlug', 'productName'],
      where: { productSlug: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { productSlug: 'desc' } },
      take: 8,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      source: row.source,
      productSlug: row.productSlug,
      productName: row.productName,
      pagePath: row.pagePath,
      locale: row.locale,
      currency: row.currency,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    counts: { today, week, month, allTime },
    bySource: Object.fromEntries(bySourceRaw.map((row) => [row.source, row._count._all])) as Partial<
      Record<WhatsAppSource, number>
    >,
    byProduct: byProductRaw.map((row) => ({
      slug: row.productSlug,
      name: row.productName,
      clicks: row._count._all,
    })),
  };
};

/** Small figure for the products landing screen. */
export const getWhatsAppClickCounts = async () => {
  const [today, week, allTime] = await Promise.all([
    prisma.whatsAppInteraction.count({ where: { createdAt: { gte: since(1) } } }),
    prisma.whatsAppInteraction.count({ where: { createdAt: { gte: since(7) } } }),
    prisma.whatsAppInteraction.count(),
  ]);
  return { today, week, allTime };
};
