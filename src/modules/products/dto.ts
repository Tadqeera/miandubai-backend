import type { Prisma } from '@prisma/client';
import { mergeTranslation, type Locale } from '../../lib/locale.js';
import { logger } from '../../lib/logger.js';
import { convertUsdToAed, fromMinorUnits, toMinorUnits } from '../../lib/money.js';
import { serializeMedia, type MediaDto } from '../media/service.js';
import type { SettingValues } from '../settings/registry.js';
import { namesAnotherProduct, resolveName, tidySpacing, type NameDefect } from './identity.js';

export const productInclude = {
  translations: true,
  images: {
    include: { mediaAsset: true },
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
  },
  categories: { include: { category: { include: { translations: true } } } },
  collections: { include: { collection: { include: { translations: true } } } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export const resolveStockStatus = (stockQuantity: number, lowStockThreshold: number): StockStatus => {
  if (stockQuantity <= 0) return 'OUT_OF_STOCK';
  if (stockQuantity <= Math.max(lowStockThreshold, 0)) return 'LOW_STOCK';
  return 'IN_STOCK';
};

export interface PriceDto {
  usd: string;
  aed: string | null;
  compareAtUsd: string | null;
  compareAtAed: string | null;
  /** true when the AED figure was derived from the fallback rate. */
  aedIsDerived: boolean;
}

const buildPrice = (product: ProductWithRelations, aedPerUsd: number): PriceDto => {
  const usdMinor = toMinorUnits(product.priceUsd) ?? 0;
  const explicitAed = toMinorUnits(product.priceAed);
  const aedMinor = explicitAed ?? convertUsdToAed(usdMinor, aedPerUsd);

  const compareUsdMinor = toMinorUnits(product.compareAtPriceUsd);
  const explicitCompareAed = toMinorUnits(product.compareAtPriceAed);
  const compareAedMinor = explicitCompareAed ?? convertUsdToAed(compareUsdMinor, aedPerUsd);

  return {
    usd: fromMinorUnits(usdMinor) ?? '0.00',
    aed: fromMinorUnits(aedMinor),
    compareAtUsd: fromMinorUnits(compareUsdMinor),
    compareAtAed: fromMinorUnits(compareAedMinor),
    aedIsDerived: explicitAed === null,
  };
};

const altFor = (image: ProductWithRelations['images'][number], locale: Locale): string | null => {
  switch (locale) {
    case 'fr':
      return image.altFr ?? image.altEn;
    case 'es':
      return image.altEs ?? image.altEn;
    default:
      return image.altEn;
  }
};

export interface ProductImageDto extends MediaDto {
  imageId: number;
  isPrimary: boolean;
  alt: string | null;
}

const serializeImages = (
  product: ProductWithRelations,
  locale: Locale,
  name: string,
  identity: { slug: string; brand: string; catalogueSlugs: readonly string[] },
  defects: NameDefect[],
): ProductImageDto[] =>
  product.images.map((image, index) => {
    // Falls back to a descriptive alt rather than leaving it empty, and never
    // describes the picture as a different product (see identity.ts). An alt is
    // free prose — "a test bottle on stone" says nothing about which fragrance
    // it is — so only a value naming another product is replaced.
    const fallback = `${product.brandName} ${name}${index > 0 ? `, view ${index + 1}` : ''}`;
    const resolved = resolveName(`images[${index}].alt`, altFor(image, locale), { ...identity, fallback });
    defects.push(...resolved.defects);

    return {
      ...serializeMedia(image.mediaAsset),
      imageId: image.id,
      isPrimary: image.isPrimary,
      alt: resolved.value,
    };
  });

/**
 * Says once, in the log, that a translation row needs correcting in the
 * administration. Deduplicated per product and language, because a card is
 * serialised on every listing request and this must not become noise.
 */
const reportedDefects = new Set<string>();

const reportNameDefects = (slug: string, locale: Locale, defects: readonly NameDefect[]) => {
  for (const defect of defects) {
    // Spacing is tidied silently; it is a formatting slip, not a wrong answer.
    if (defect.reason === 'spacing') continue;
    const key = `${slug}:${locale}:${defect.field}:${defect.reason}`;
    if (reportedDefects.has(key)) continue;
    reportedDefects.add(key);
    logger.warn(
      { slug, locale, field: defect.field, reason: defect.reason, stored: defect.value },
      'Product translation corrected on the way out; fix this row in the administration.',
    );
  }
};

/**
 * An SEO title is kept whole — the brand suffix belongs in a `<title>`, unlike
 * in a product name — but it is dropped entirely if it names a different
 * product, so the page falls back to deriving a title from the corrected name.
 */
const resolveSeoTitle = (
  raw: string | null | undefined,
  { slug, catalogueSlugs }: { slug: string; catalogueSlugs: readonly string[] },
): string | null => {
  const value = tidySpacing(raw ?? '');
  if (!value) return null;
  return namesAnotherProduct(value, slug, catalogueSlugs) ? null : value;
};

const serializeTaxonomy = (
  rows: Array<{ slug: string; translations: Array<{ locale: string; name: string }> }>,
  locale: Locale,
) =>
  rows.map((row) => ({
    slug: row.slug,
    name: mergeTranslation(row.translations, locale)?.name ?? row.slug,
  }));

export interface ProductCardDto {
  id: number;
  slug: string;
  sku: string;
  brandName: string;
  name: string;
  shortDescription: string | null;
  fragranceType: string;
  audience: string;
  sizeMl: number | null;
  price: PriceDto;
  stockStatus: StockStatus;
  stockQuantity: number | null;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  allowWhatsAppOrder: boolean;
  primaryImage: ProductImageDto | null;
  categories: Array<{ slug: string; name: string }>;
  collections: Array<{ slug: string; name: string }>;
  publishedAt: string | null;
}

export interface ProductDetailDto extends ProductCardDto {
  fullDescription: string | null;
  scentStory: string | null;
  topNotes: string | null;
  heartNotes: string | null;
  baseNotes: string | null;
  howToUse: string | null;
  safetyText: string | null;
  ingredients: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ProductImageDto[];
  delivery: { minDays: number; maxDays: number };
  processing: { minDays: number; maxDays: number } | null;
  model3d: { glbUrl: string; usdzUrl: string | null } | null;
  updatedAt: string;
}

interface ResolvedIdentity {
  name: string;
  images: ProductImageDto[];
  identity: { slug: string; brand: string; catalogueSlugs: readonly string[] };
}

/**
 * The other products a translation could have been confused with.
 *
 * Callers that are already listing products pass the slugs they have in hand;
 * a single product page passes the catalogue's slugs, which is one small query.
 * An empty list simply means the wrong-product check does not run, and the
 * names are cleaned but never rewritten.
 */
export type CatalogueSlugs = readonly string[];

/**
 * This product's name and pictures in one language, with both translation
 * faults corrected and each correction reported once.
 *
 * Resolved a single time per serialisation and shared by the card and the
 * detail record, so a detail request does not repeat the work — or the warning.
 */
const resolveProductIdentity = (
  product: ProductWithRelations,
  locale: Locale,
  settings: SettingValues,
  catalogueSlugs: CatalogueSlugs,
): ResolvedIdentity => {
  const translation = mergeTranslation(product.translations, locale);
  const defects: NameDefect[] = [];

  // The English row is this product's identity: a translation may restate it in
  // another language but may never turn it into a different product.
  const englishName = tidySpacing(
    product.translations.find((row) => row.locale === 'en')?.name ?? translation?.name ?? product.sku,
  );
  const identity = { slug: product.slug, brand: settings['brand.displayName'], catalogueSlugs };

  const resolvedName = resolveName('name', translation?.name, { ...identity, fallback: englishName });
  defects.push(...resolvedName.defects);
  const name = resolvedName.value;

  const images = serializeImages(product, locale, name, identity, defects);
  reportNameDefects(product.slug, locale, defects);

  return { name, images, identity };
};

const buildCard = (
  product: ProductWithRelations,
  locale: Locale,
  settings: SettingValues,
  { name, images }: ResolvedIdentity,
): ProductCardDto => {
  const translation = mergeTranslation(product.translations, locale);

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    brandName: product.brandName,
    name,
    shortDescription: translation?.shortDescription ?? null,
    fragranceType: product.fragranceType,
    audience: product.audience,
    sizeMl: product.sizeMl,
    price: buildPrice(product, settings['currency.aedPerUsd']),
    stockStatus: resolveStockStatus(product.stockQuantity, product.lowStockThreshold),
    stockQuantity: settings['product.showStockCount'] ? product.stockQuantity : null,
    featured: product.featured,
    bestseller: product.bestseller,
    newArrival: product.newArrival,
    allowWhatsAppOrder: product.allowWhatsAppOrder,
    primaryImage: images[0] ?? null,
    categories: serializeTaxonomy(
      product.categories.map((row) => row.category),
      locale,
    ),
    collections: serializeTaxonomy(
      product.collections.map((row) => row.collection),
      locale,
    ),
    publishedAt: product.publishedAt?.toISOString() ?? null,
  };
};

export const serializeProductCard = (
  product: ProductWithRelations,
  locale: Locale,
  settings: SettingValues,
  catalogueSlugs: CatalogueSlugs = [],
): ProductCardDto =>
  buildCard(product, locale, settings, resolveProductIdentity(product, locale, settings, catalogueSlugs));

export const serializeProductDetail = (
  product: ProductWithRelations,
  locale: Locale,
  settings: SettingValues,
  catalogueSlugs: CatalogueSlugs = [],
): ProductDetailDto => {
  const resolved = resolveProductIdentity(product, locale, settings, catalogueSlugs);
  const card = buildCard(product, locale, settings, resolved);
  const translation = mergeTranslation(product.translations, locale);

  // A per-product override of 0 days means "not recorded", not "same day" —
  // the column defaults to null but a form can post 0. Anything non-positive
  // falls back to the site-wide estimate rather than quoting "0 days".
  const positive = (value: number | null): number | null => (value !== null && value > 0 ? value : null);

  const deliveryMin = positive(product.deliveryMinDays) ?? settings['shipping.deliveryMinDays'];
  const deliveryMax = positive(product.deliveryMaxDays) ?? settings['shipping.deliveryMaxDays'];

  // Clamp the floor first, then hold the ceiling at or above it, so a range can
  // never render inverted ("1–0 business days").
  const deliveryFloor = Math.max(1, deliveryMin);
  const deliveryCeiling = Math.max(deliveryFloor, deliveryMax);

  const processingMin = positive(product.processingMinDays);
  const processingMax = positive(product.processingMaxDays);

  return {
    ...card,
    fullDescription: translation?.fullDescription ?? null,
    scentStory: translation?.scentStory ?? null,
    topNotes: translation?.topNotes ?? null,
    heartNotes: translation?.heartNotes ?? null,
    baseNotes: translation?.baseNotes ?? null,
    howToUse: translation?.howToUse ?? null,
    safetyText: translation?.safetyText ?? null,
    ingredients: product.ingredients,
    seoTitle: resolveSeoTitle(translation?.seoTitle, {
      slug: product.slug,
      catalogueSlugs: resolved.identity.catalogueSlugs,
    }),
    seoDescription: translation?.seoDescription ?? translation?.shortDescription ?? null,
    images: resolved.images,
    delivery: { minDays: deliveryFloor, maxDays: deliveryCeiling },
    processing:
      processingMin === null
        ? null
        : { minDays: processingMin, maxDays: Math.max(processingMin, processingMax ?? processingMin) },
    // No viewer is advertised unless a real model exists.
    model3d: product.model3dGlbUrl ? { glbUrl: product.model3dGlbUrl, usdzUrl: product.model3dUsdzUrl } : null,
    updatedAt: product.updatedAt.toISOString(),
  };
};

/** Full record for the admin editor, including every translation row. */
export const serializeProductForAdmin = (product: ProductWithRelations) => ({
  id: product.id,
  uuid: product.uuid,
  slug: product.slug,
  sku: product.sku,
  brandName: product.brandName,
  status: product.status,
  fragranceType: product.fragranceType,
  audience: product.audience,
  sizeMl: product.sizeMl,
  priceUsd: product.priceUsd.toString(),
  priceAed: product.priceAed?.toString() ?? null,
  compareAtPriceUsd: product.compareAtPriceUsd?.toString() ?? null,
  compareAtPriceAed: product.compareAtPriceAed?.toString() ?? null,
  stockQuantity: product.stockQuantity,
  lowStockThreshold: product.lowStockThreshold,
  processingMinDays: product.processingMinDays,
  processingMaxDays: product.processingMaxDays,
  deliveryMinDays: product.deliveryMinDays,
  deliveryMaxDays: product.deliveryMaxDays,
  ingredients: product.ingredients,
  featured: product.featured,
  bestseller: product.bestseller,
  newArrival: product.newArrival,
  allowWhatsAppOrder: product.allowWhatsAppOrder,
  sortOrder: product.sortOrder,
  model3dGlbUrl: product.model3dGlbUrl,
  model3dUsdzUrl: product.model3dUsdzUrl,
  publishedAt: product.publishedAt?.toISOString() ?? null,
  createdAt: product.createdAt.toISOString(),
  updatedAt: product.updatedAt.toISOString(),
  stockStatus: resolveStockStatus(product.stockQuantity, product.lowStockThreshold),
  translations: product.translations.map((row) => ({
    locale: row.locale,
    name: row.name,
    shortDescription: row.shortDescription,
    fullDescription: row.fullDescription,
    scentStory: row.scentStory,
    topNotes: row.topNotes,
    heartNotes: row.heartNotes,
    baseNotes: row.baseNotes,
    howToUse: row.howToUse,
    safetyText: row.safetyText,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  })),
  images: product.images.map((image) => ({
    id: image.id,
    mediaAssetId: image.mediaAssetId,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder,
    altEn: image.altEn,
    altFr: image.altFr,
    altEs: image.altEs,
    media: serializeMedia(image.mediaAsset),
  })),
  categoryIds: product.categories.map((row) => row.categoryId),
  collectionIds: product.collections.map((row) => row.collectionId),
});

export type AdminProductDto = ReturnType<typeof serializeProductForAdmin>;
