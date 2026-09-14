import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { SUPPORTED_LOCALES, mergeTranslation, type Locale } from '../../lib/locale.js';
import { CONTENT_BLOCKS, findContentBlock } from './registry.js';

const optional = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) return null;
      const text = value.trim();
      return text === '' ? null : text.slice(0, max);
    });

export const contentWriteSchema = z.object({
  isActive: z.boolean().optional().default(true),
  translations: z
    .array(
      z.object({
        locale: z.enum(SUPPORTED_LOCALES),
        eyebrow: optional(191),
        heading: optional(255),
        subheading: optional(500),
        body: optional(20_000),
        ctaLabel: optional(120),
        ctaHref: optional(255),
        ctaLabelAlt: optional(120),
        ctaHrefAlt: optional(255),
        items: z
          .array(z.record(z.string().max(40), z.string().max(5000)))
          .max(30)
          .optional()
          .nullable(),
      }),
    )
    .min(1),
});

export type ContentWriteInput = z.infer<typeof contentWriteSchema>;

export interface ContentBlockDto {
  key: string;
  eyebrow: string | null;
  heading: string | null;
  subheading: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaLabelAlt: string | null;
  ctaHrefAlt: string | null;
  items: Array<Record<string, string>>;
}

const isPlainObject = (entry: unknown): entry is Record<string, unknown> =>
  typeof entry === 'object' && entry !== null && !Array.isArray(entry);

const readItems = (value: Prisma.JsonValue | null | undefined): Array<Record<string, string>> => {
  if (!Array.isArray(value)) return [];
  return (value as unknown[]).filter(isPlainObject).map((entry) => {
    const row: Record<string, string> = {};
    for (const [key, item] of Object.entries(entry)) {
      if (typeof item === 'string') row[key] = item;
    }
    return row;
  });
};

const serialize = (
  key: string,
  translations: Array<{ locale: string; items: Prisma.JsonValue | null } & Record<string, unknown>>,
  locale: Locale,
): ContentBlockDto => {
  const merged = mergeTranslation(translations, locale);
  return {
    key,
    eyebrow: (merged?.eyebrow as string | null) ?? null,
    heading: (merged?.heading as string | null) ?? null,
    subheading: (merged?.subheading as string | null) ?? null,
    body: (merged?.body as string | null) ?? null,
    ctaLabel: (merged?.ctaLabel as string | null) ?? null,
    ctaHref: (merged?.ctaHref as string | null) ?? null,
    ctaLabelAlt: (merged?.ctaLabelAlt as string | null) ?? null,
    ctaHrefAlt: (merged?.ctaHrefAlt as string | null) ?? null,
    items: readItems(merged?.items ?? null),
  };
};

/** Every active block for a locale, keyed for direct lookup by the storefront. */
export const getContentBundle = async (locale: Locale): Promise<Record<string, ContentBlockDto>> => {
  const rows = await prisma.siteContent.findMany({
    where: { isActive: true },
    include: { translations: true },
    orderBy: { sortOrder: 'asc' },
  });

  const bundle: Record<string, ContentBlockDto> = {};
  for (const row of rows) {
    bundle[row.key] = serialize(row.key, row.translations, locale);
  }
  return bundle;
};

export const getContentBlock = async (key: string, locale: Locale): Promise<ContentBlockDto> => {
  const row = await prisma.siteContent.findUnique({ where: { key }, include: { translations: true } });
  if (!row || !row.isActive) throw ApiError.notFound('Content block not found.');
  return serialize(row.key, row.translations, locale);
};

export const listContentForAdmin = async () => {
  const rows = await prisma.siteContent.findMany({ include: { translations: true }, orderBy: { sortOrder: 'asc' } });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return CONTENT_BLOCKS.map((definition) => {
    const row = byKey.get(definition.key);
    return {
      ...definition,
      isActive: row?.isActive ?? true,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
      translations: SUPPORTED_LOCALES.map((locale) => {
        const translation = row?.translations.find((entry) => entry.locale === locale);
        return {
          locale,
          eyebrow: translation?.eyebrow ?? null,
          heading: translation?.heading ?? null,
          subheading: translation?.subheading ?? null,
          body: translation?.body ?? null,
          ctaLabel: translation?.ctaLabel ?? null,
          ctaHref: translation?.ctaHref ?? null,
          ctaLabelAlt: translation?.ctaLabelAlt ?? null,
          ctaHrefAlt: translation?.ctaHrefAlt ?? null,
          items: readItems(translation?.items ?? null),
        };
      }),
    };
  });
};

export const upsertContent = async (key: string, input: ContentWriteInput) => {
  const definition = findContentBlock(key);
  if (!definition) throw ApiError.notFound('Unknown content block.');

  const translations = input.translations.map((row) => ({
    locale: row.locale,
    eyebrow: row.eyebrow,
    heading: row.heading,
    subheading: row.subheading,
    body: row.body,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    ctaLabelAlt: row.ctaLabelAlt,
    ctaHrefAlt: row.ctaHrefAlt,
    items: (row.items ?? undefined) as Prisma.InputJsonValue | undefined,
  }));

  await prisma.$transaction(async (tx) => {
    const record = await tx.siteContent.upsert({
      where: { key },
      create: { key, group: definition.group, sortOrder: definition.sortOrder, isActive: input.isActive },
      update: { group: definition.group, sortOrder: definition.sortOrder, isActive: input.isActive },
    });
    await tx.siteContentTranslation.deleteMany({ where: { siteContentId: record.id } });
    await tx.siteContentTranslation.createMany({
      data: translations.map((row) => ({ ...row, siteContentId: record.id })),
    });
  });

  return { key };
};
