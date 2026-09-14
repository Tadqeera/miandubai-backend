import { z } from 'zod';
import { ApiError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { SUPPORTED_LOCALES, mergeTranslation, type Locale } from '../../lib/locale.js';

/** The seven policies the storefront links from its footer. */
export const LEGAL_SLUGS = [
  'terms',
  'privacy',
  'shipping',
  'returns',
  'product-safety',
  'cookies',
  'accessibility',
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const legalWriteSchema = z.object({
  isPublished: z.boolean().optional().default(true),
  effectiveDate: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }),
  translations: z
    .array(
      z.object({
        locale: z.enum(SUPPORTED_LOCALES),
        title: z.string().trim().min(1).max(191),
        content: z.string().max(200_000),
        seoTitle: z
          .union([z.string(), z.null()])
          .optional()
          .transform((value) => (value?.trim() ? value.trim().slice(0, 191) : null)),
        seoDescription: z
          .union([z.string(), z.null()])
          .optional()
          .transform((value) => (value?.trim() ? value.trim().slice(0, 320) : null)),
      }),
    )
    .min(1),
});

export type LegalWriteInput = z.infer<typeof legalWriteSchema>;

export const listPublicLegalPages = async (locale: Locale) => {
  const rows = await prisma.legalPage.findMany({
    where: { isPublished: true },
    include: { translations: true },
    orderBy: { sortOrder: 'asc' },
  });

  return rows.map((row) => ({
    slug: row.slug,
    title: mergeTranslation(row.translations, locale)?.title ?? row.slug,
  }));
};

export const getPublicLegalPage = async (slug: string, locale: Locale) => {
  const row = await prisma.legalPage.findUnique({ where: { slug }, include: { translations: true } });
  if (!row || !row.isPublished) throw ApiError.notFound('This policy is not available.');

  const translation = mergeTranslation(row.translations, locale);
  if (!translation) throw ApiError.notFound('This policy is not available.');

  return {
    slug: row.slug,
    title: translation.title,
    content: translation.content,
    seoTitle: translation.seoTitle,
    seoDescription: translation.seoDescription,
    effectiveDate: row.effectiveDate?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
};

export const listAdminLegalPages = async () => {
  const rows = await prisma.legalPage.findMany({ include: { translations: true }, orderBy: { sortOrder: 'asc' } });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    effectiveDate: row.effectiveDate?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    translations: SUPPORTED_LOCALES.map((locale) => {
      const translation = row.translations.find((entry) => entry.locale === locale);
      return {
        locale,
        title: translation?.title ?? '',
        content: translation?.content ?? '',
        seoTitle: translation?.seoTitle ?? null,
        seoDescription: translation?.seoDescription ?? null,
      };
    }),
  }));
};

export const updateLegalPage = async (slug: string, input: LegalWriteInput) => {
  const existing = await prisma.legalPage.findUnique({ where: { slug }, select: { id: true } });
  if (!existing) throw ApiError.notFound('Legal page not found.');

  await prisma.$transaction(async (tx) => {
    await tx.legalPageTranslation.deleteMany({ where: { legalPageId: existing.id } });
    await tx.legalPage.update({
      where: { id: existing.id },
      data: {
        isPublished: input.isPublished,
        effectiveDate: input.effectiveDate,
        translations: {
          create: input.translations.filter((row) => row.title.trim() !== '' && row.content.trim() !== ''),
        },
      },
    });
  });

  return { slug };
};

export const listLegalForSitemap = () =>
  prisma.legalPage.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } });
