import { Audience, FragranceType, ProductStatus } from '@prisma/client';
import { z } from 'zod';
import { SUPPORTED_LOCALES } from '../../lib/locale.js';

/** Accepts `?audience=MEN&audience=WOMEN` and `?audience=MEN,WOMEN`. */
const list = <T extends z.ZodTypeAny>(item: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      const entries = (Array.isArray(value) ? value : [value]).flatMap((entry) => entry.split(','));
      return entries.map((entry) => entry.trim()).filter(Boolean);
    })
    .pipe(z.array(item).optional());

const positiveInt = (fallback: number, max: number) =>
  z.coerce.number().int().min(1).max(max).optional().default(fallback);

export const PRODUCT_SORTS = ['featured', 'newest', 'price-asc', 'price-desc', 'name'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const publicProductQuerySchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES).optional().default('en'),
  page: positiveInt(1, 500),
  pageSize: positiveInt(12, 48),
  q: z.string().trim().max(120).optional(),
  collection: z.string().trim().max(191).optional(),
  category: z.string().trim().max(191).optional(),
  audience: list(z.nativeEnum(Audience)),
  fragranceType: list(z.nativeEnum(FragranceType)),
  sizeMl: list(z.coerce.number().int().min(1).max(10_000)),
  minPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  inStockOnly: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === 'true'),
  featured: z.union([z.literal('true'), z.literal('false')]).optional(),
  bestseller: z.union([z.literal('true'), z.literal('false')]).optional(),
  newArrival: z.union([z.literal('true'), z.literal('false')]).optional(),
  sort: z.enum(PRODUCT_SORTS).optional().default('featured'),
});

export type PublicProductQuery = z.infer<typeof publicProductQuerySchema>;

export const productSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(191),
});

export const searchQuerySchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES).optional().default('en'),
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(10).optional().default(6),
});

export const availabilityQuerySchema = z.object({
  slugs: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')).map((entry) => entry.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(191)).max(60)),
  locale: z.enum(SUPPORTED_LOCALES).optional().default('en'),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const decimalString = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^\d{1,8}(\.\d{1,2})?$/.test(value), 'Enter an amount such as 129 or 129.00.');

const optionalDecimal = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
  })
  .refine((value) => value === null || /^\d{1,8}(\.\d{1,2})?$/.test(value), 'Enter an amount such as 129 or 129.00.');

const optionalInt = (max: number) =>
  z
    .union([z.coerce.number().int().min(0).max(max), z.literal('' as const), z.null()])
    .optional()
    .transform((value) => (value === '' || value === null || value === undefined ? null : Number(value)));

const trimmedOptional = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) return null;
      const text = value.trim();
      return text === '' ? null : text.slice(0, max);
    });

export const productTranslationSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  name: z.string().trim().max(191),
  shortDescription: trimmedOptional(500),
  fullDescription: trimmedOptional(20_000),
  scentStory: trimmedOptional(20_000),
  topNotes: trimmedOptional(500),
  heartNotes: trimmedOptional(500),
  baseNotes: trimmedOptional(500),
  howToUse: trimmedOptional(20_000),
  safetyText: trimmedOptional(20_000),
  seoTitle: trimmedOptional(191),
  seoDescription: trimmedOptional(320),
});

export const productImageInputSchema = z.object({
  mediaAssetId: z.number().int().positive(),
  isPrimary: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
  altEn: trimmedOptional(255),
  altFr: trimmedOptional(255),
  altEs: trimmedOptional(255),
});

export const productWriteSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(191)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and hyphens only.')
    .optional(),
  sku: z.string().trim().min(1, 'A SKU is required.').max(64),
  brandName: z.string().trim().min(1).max(120).optional().default('Mian Dubai'),
  status: z.nativeEnum(ProductStatus).optional().default('DRAFT'),
  fragranceType: z.nativeEnum(FragranceType).optional().default('EAU_DE_PARFUM'),
  audience: z.nativeEnum(Audience).optional().default('UNISEX'),
  sizeMl: optionalInt(10_000),
  priceUsd: decimalString,
  priceAed: optionalDecimal,
  compareAtPriceUsd: optionalDecimal,
  compareAtPriceAed: optionalDecimal,
  stockQuantity: z.coerce.number().int().min(0).max(1_000_000).optional().default(0),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000).optional().default(3),
  processingMinDays: optionalInt(365),
  processingMaxDays: optionalInt(365),
  deliveryMinDays: optionalInt(365),
  deliveryMaxDays: optionalInt(365),
  ingredients: trimmedOptional(20_000),
  featured: z.boolean().optional().default(false),
  bestseller: z.boolean().optional().default(false),
  newArrival: z.boolean().optional().default(false),
  allowWhatsAppOrder: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  model3dGlbUrl: trimmedOptional(500),
  model3dUsdzUrl: trimmedOptional(500),
  translations: z.array(productTranslationSchema).min(1, 'English content is required.'),
  images: z.array(productImageInputSchema).max(20).optional().default([]),
  categoryIds: z.array(z.number().int().positive()).max(30).optional().default([]),
  collectionIds: z.array(z.number().int().positive()).max(30).optional().default([]),
});

export type ProductWriteInput = z.infer<typeof productWriteSchema>;

export const adminProductQuerySchema = z.object({
  page: positiveInt(1, 1000),
  pageSize: positiveInt(20, 100),
  q: z.string().trim().max(120).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  stock: z.enum(['low', 'out']).optional(),
  featured: z.union([z.literal('true'), z.literal('false')]).optional(),
  includeDeleted: z.union([z.literal('true'), z.literal('false')]).optional(),
  sort: z.enum(['updated', 'name', 'sku', 'price-asc', 'price-desc', 'stock']).optional().default('updated'),
});
