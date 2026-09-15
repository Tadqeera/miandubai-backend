import { Prisma, type ProductStatus } from '@prisma/client';
import { ApiError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { DEFAULT_LOCALE, type Locale } from '../../lib/locale.js';
import { uniqueSlug } from '../../lib/slug.js';
import { getSettings } from '../settings/service.js';
import {
  productInclude,
  serializeProductCard,
  serializeProductDetail,
  serializeProductForAdmin,
  type ProductCardDto,
  type ProductWithRelations,
} from './dto.js';
import type { ProductWriteInput, PublicProductQuery } from './schemas.js';

/** Only published, non-deleted products are ever visible to the storefront. */
const PUBLIC_SCOPE: Prisma.ProductWhereInput = { status: 'PUBLISHED', deletedAt: null };

const buildPublicWhere = (query: PublicProductQuery): Prisma.ProductWhereInput => {
  const and: Prisma.ProductWhereInput[] = [PUBLIC_SCOPE];

  if (query.collection) {
    and.push({ collections: { some: { collection: { slug: query.collection, isActive: true } } } });
  }
  if (query.category) {
    and.push({ categories: { some: { category: { slug: query.category, isActive: true } } } });
  }
  if (query.audience?.length) and.push({ audience: { in: query.audience } });
  if (query.fragranceType?.length) and.push({ fragranceType: { in: query.fragranceType } });
  if (query.sizeMl?.length) and.push({ sizeMl: { in: query.sizeMl } });
  if (query.minPrice !== undefined) and.push({ priceUsd: { gte: new Prisma.Decimal(query.minPrice) } });
  if (query.maxPrice !== undefined) and.push({ priceUsd: { lte: new Prisma.Decimal(query.maxPrice) } });
  if (query.inStockOnly) and.push({ stockQuantity: { gt: 0 } });
  if (query.featured === 'true') and.push({ featured: true });
  if (query.bestseller === 'true') and.push({ bestseller: true });
  if (query.newArrival === 'true') and.push({ newArrival: true });

  if (query.q) {
    // The database collation (utf8mb4_unicode_ci) already makes `contains`
    // case-insensitive, so no `mode` option is needed here.
    const term = query.q;
    and.push({
      OR: [
        { sku: { contains: term } },
        { brandName: { contains: term } },
        {
          translations: {
            some: {
              OR: [
                { name: { contains: term } },
                { shortDescription: { contains: term } },
                { topNotes: { contains: term } },
                { heartNotes: { contains: term } },
                { baseNotes: { contains: term } },
              ],
            },
          },
        },
        { collections: { some: { collection: { translations: { some: { name: { contains: term } } } } } } },
        { categories: { some: { category: { translations: { some: { name: { contains: term } } } } } } },
      ],
    });
  }

  return { AND: and };
};

const buildPublicOrderBy = (sort: PublicProductQuery['sort']): Prisma.ProductOrderByWithRelationInput[] => {
  switch (sort) {
    case 'newest':
      return [{ publishedAt: 'desc' }, { id: 'desc' }];
    case 'price-asc':
      return [{ priceUsd: 'asc' }, { id: 'asc' }];
    case 'price-desc':
      return [{ priceUsd: 'desc' }, { id: 'asc' }];
    case 'name':
      return [{ sortOrder: 'asc' }, { sku: 'asc' }];
    case 'featured':
    default:
      return [{ featured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }, { id: 'desc' }];
  }
};

export interface PagedProducts {
  items: ProductCardDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const listPublicProducts = async (query: PublicProductQuery): Promise<PagedProducts> => {
  const where = buildPublicWhere(query);
  const settings = await getSettings();

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: buildPublicOrderBy(query.sort),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: rows.map((row) => serializeProductCard(row, query.locale, settings)),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
};

/** Distinct filter values, derived from published products only. */
export const getPublicFacets = async () => {
  const rows = await prisma.product.findMany({
    where: PUBLIC_SCOPE,
    select: { audience: true, fragranceType: true, sizeMl: true, priceUsd: true },
  });

  // A size of 0 means "not recorded yet", not a 0 ml bottle — it must never
  // become a "0 ml" filter option.
  const sizes = [...new Set(rows.map((row) => row.sizeMl).filter((size): size is number => (size ?? 0) > 0))].sort(
    (a, b) => a - b,
  );
  const prices = rows.map((row) => Number.parseFloat(row.priceUsd.toString())).filter(Number.isFinite);

  return {
    audiences: [...new Set(rows.map((row) => row.audience))].sort(),
    fragranceTypes: [...new Set(rows.map((row) => row.fragranceType))].sort(),
    sizes,
    priceRange:
      prices.length > 0
        ? { minUsd: Math.floor(Math.min(...prices)), maxUsd: Math.ceil(Math.max(...prices)) }
        : { minUsd: 0, maxUsd: 0 },
    total: rows.length,
  };
};

export const getPublicProductBySlug = async (slug: string, locale: Locale) => {
  const product = await prisma.product.findFirst({
    where: { slug, ...PUBLIC_SCOPE },
    include: productInclude,
  });
  if (!product) throw ApiError.notFound('This fragrance is not available.');

  const settings = await getSettings();
  return serializeProductDetail(product, locale, settings);
};

/**
 * Related fragrances, preferring shared collections, then category, then the
 * same audience or fragrance family. Never includes the current product and
 * never repeats one.
 */
export const getRelatedProducts = async (slug: string, locale: Locale, limit = 4): Promise<ProductCardDto[]> => {
  const product = await prisma.product.findFirst({
    where: { slug, ...PUBLIC_SCOPE },
    select: {
      id: true,
      audience: true,
      fragranceType: true,
      collections: { select: { collectionId: true } },
      categories: { select: { categoryId: true } },
    },
  });
  if (!product) return [];

  const collectionIds = product.collections.map((row) => row.collectionId);
  const categoryIds = product.categories.map((row) => row.categoryId);

  const tiers: Prisma.ProductWhereInput[] = [
    ...(collectionIds.length ? [{ collections: { some: { collectionId: { in: collectionIds } } } }] : []),
    ...(categoryIds.length ? [{ categories: { some: { categoryId: { in: categoryIds } } } }] : []),
    { audience: product.audience },
    { fragranceType: product.fragranceType },
    {},
  ];

  const settings = await getSettings();
  const picked = new Map<number, ProductWithRelations>();

  for (const tier of tiers) {
    if (picked.size >= limit) break;
    const rows = await prisma.product.findMany({
      where: { AND: [PUBLIC_SCOPE, tier, { id: { notIn: [product.id, ...picked.keys()] } }] },
      include: productInclude,
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }],
      take: limit - picked.size,
    });
    for (const row of rows) picked.set(row.id, row);
  }

  return [...picked.values()].slice(0, limit).map((row) => serializeProductCard(row, locale, settings));
};

export const searchProducts = async (term: string, locale: Locale, limit: number) => {
  const settings = await getSettings();
  const rows = await prisma.product.findMany({
    where: buildPublicWhere({
      locale,
      q: term,
      page: 1,
      pageSize: limit,
      sort: 'featured',
      inStockOnly: false,
    } as PublicProductQuery),
    include: productInclude,
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    take: limit,
  });

  return rows.map((row) => serializeProductCard(row, locale, settings));
};

/**
 * Re-checks availability for the items in a shopping bag immediately before the
 * WhatsApp message is built, so a sold-out or unpublished product cannot be
 * sent as an order request.
 */
export const checkAvailability = async (slugs: string[], locale: Locale) => {
  const settings = await getSettings();
  const rows = await prisma.product.findMany({
    where: { slug: { in: slugs }, ...PUBLIC_SCOPE },
    include: productInclude,
  });

  const found = new Map(rows.map((row) => [row.slug, serializeProductCard(row, locale, settings)]));

  return slugs.map((slug) => {
    const product = found.get(slug);
    return product
      ? { slug, available: true as const, product }
      : { slug, available: false as const, product: null };
  });
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface PublishProblem {
  field: string;
  message: string;
}

/**
 * Publication gate. Drafts stay permissive on purpose; a PUBLISHED product must
 * be complete enough that the storefront never renders a broken card.
 */
export const validateForPublish = (input: ProductWriteInput, allowWithoutImage: boolean): PublishProblem[] => {
  const problems: PublishProblem[] = [];
  const english = input.translations.find((row) => row.locale === DEFAULT_LOCALE);

  if (!english || english.name.trim() === '') {
    problems.push({ field: 'translations.en.name', message: 'An English product name is required to publish.' });
  }
  if (!input.sku.trim()) {
    problems.push({ field: 'sku', message: 'A SKU is required to publish.' });
  }
  if (Number.parseFloat(input.priceUsd) <= 0) {
    problems.push({ field: 'priceUsd', message: 'A USD price above zero is required to publish.' });
  }
  if (input.sizeMl === null || input.sizeMl <= 0) {
    problems.push({ field: 'sizeMl', message: 'A bottle size in millilitres is required to publish.' });
  }
  if (!allowWithoutImage && input.images.length === 0) {
    problems.push({ field: 'images', message: 'Add at least one product image, or confirm publishing without one.' });
  }
  if (input.processingMinDays !== null && input.processingMaxDays !== null && input.processingMinDays > input.processingMaxDays) {
    problems.push({ field: 'processingMaxDays', message: 'Maximum processing days cannot be less than the minimum.' });
  }
  if (input.deliveryMinDays !== null && input.deliveryMaxDays !== null && input.deliveryMinDays > input.deliveryMaxDays) {
    problems.push({ field: 'deliveryMaxDays', message: 'Maximum delivery days cannot be less than the minimum.' });
  }

  return problems;
};

const normalizeImages = (images: ProductWriteInput['images']) => {
  const ordered = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const primaryIndex = Math.max(
    0,
    ordered.findIndex((image) => image.isPrimary),
  );
  return ordered.map((image, index) => ({
    mediaAssetId: image.mediaAssetId,
    isPrimary: index === primaryIndex,
    sortOrder: index,
    altEn: image.altEn,
    altFr: image.altFr,
    altEs: image.altEs,
  }));
};

const translationRows = (translations: ProductWriteInput['translations']) =>
  translations
    // Empty non-English rows are dropped so the fallback keeps working.
    .filter((row) => row.locale === DEFAULT_LOCALE || row.name.trim() !== '')
    .map((row) => ({ ...row, name: row.name.trim() }));

const slugExists = (candidate: string, excludeId?: number) =>
  prisma.product
    .findFirst({ where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } })
    .then((row) => row !== null);

/**
 * SKUs are unique across every product, archived and soft-deleted ones
 * included. Checked up front so the editor can point at the field; the unique
 * index still guards against a race. A product's own SKU is never "taken".
 */
const assertSkuAvailable = async (sku: string, excludeId?: number) => {
  const owner = await prisma.product.findFirst({
    where: { sku, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (owner) {
    throw ApiError.conflict(`Another product already uses the SKU "${sku}".`, [
      {
        field: 'sku',
        message: 'This SKU belongs to another product (archived and deleted products included). Choose a different one.',
      },
    ]);
  }
};

const unique = (ids: number[]) => [...new Set(ids)];

const idsNotFound = (wanted: number[], rows: Array<{ id: number }>) => {
  const found = new Set(rows.map((row) => row.id));
  return wanted.filter((id) => !found.has(id));
};

/**
 * Images, categories and collections are referenced by id. One removed since
 * the editor was opened would otherwise surface as a foreign-key failure with
 * no hint of which part of the form is at fault.
 */
const assertReferencesExist = async (input: ProductWriteInput) => {
  const mediaIds = unique(input.images.map((image) => image.mediaAssetId));
  const categoryIds = unique(input.categoryIds);
  const collectionIds = unique(input.collectionIds);

  const [media, categories, collections] = await Promise.all([
    mediaIds.length > 0 ? prisma.mediaAsset.findMany({ where: { id: { in: mediaIds } }, select: { id: true } }) : [],
    categoryIds.length > 0 ? prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } }) : [],
    collectionIds.length > 0
      ? prisma.collection.findMany({ where: { id: { in: collectionIds } }, select: { id: true } })
      : [],
  ]);

  const problems: PublishProblem[] = [];
  const missingMedia = idsNotFound(mediaIds, media);
  if (missingMedia.length > 0) {
    const one = missingMedia.length === 1;
    problems.push({
      field: 'images',
      message: `${one ? 'One image is' : `${missingMedia.length} images are`} no longer in the media library. Remove ${one ? 'it' : 'them'} from this product and upload again.`,
    });
  }
  if (idsNotFound(categoryIds, categories).length > 0) {
    problems.push({ field: 'categoryIds', message: 'A selected category has been deleted. Untick it and save again.' });
  }
  if (idsNotFound(collectionIds, collections).length > 0) {
    problems.push({ field: 'collectionIds', message: 'A selected collection has been deleted. Untick it and save again.' });
  }
  if (problems.length > 0) throw ApiError.validation('Some items linked to this product are no longer available.', problems);
};

/** The product's own columns, shared by create and update. */
const productScalars = (input: ProductWriteInput) => ({
  sku: input.sku.trim(),
  brandName: input.brandName,
  status: input.status,
  fragranceType: input.fragranceType,
  audience: input.audience,
  sizeMl: input.sizeMl,
  priceUsd: new Prisma.Decimal(input.priceUsd),
  priceAed: input.priceAed ? new Prisma.Decimal(input.priceAed) : null,
  compareAtPriceUsd: input.compareAtPriceUsd ? new Prisma.Decimal(input.compareAtPriceUsd) : null,
  compareAtPriceAed: input.compareAtPriceAed ? new Prisma.Decimal(input.compareAtPriceAed) : null,
  stockQuantity: input.stockQuantity,
  lowStockThreshold: input.lowStockThreshold,
  processingMinDays: input.processingMinDays,
  processingMaxDays: input.processingMaxDays,
  deliveryMinDays: input.deliveryMinDays,
  deliveryMaxDays: input.deliveryMaxDays,
  ingredients: input.ingredients,
  featured: input.featured,
  bestseller: input.bestseller,
  newArrival: input.newArrival,
  allowWhatsAppOrder: input.allowWhatsAppOrder,
  sortOrder: input.sortOrder,
  model3dGlbUrl: input.model3dGlbUrl,
  model3dUsdzUrl: input.model3dUsdzUrl,
});

export const createProduct = async (input: ProductWriteInput, allowWithoutImage: boolean) => {
  if (input.status === 'PUBLISHED') {
    const problems = validateForPublish(input, allowWithoutImage);
    if (problems.length > 0) throw ApiError.validation('This product cannot be published yet.', problems);
  }

  await Promise.all([assertSkuAvailable(input.sku.trim()), assertReferencesExist(input)]);

  const englishName = input.translations.find((row) => row.locale === DEFAULT_LOCALE)?.name ?? input.sku;
  const slug = await uniqueSlug(input.slug ?? englishName, (candidate) => slugExists(candidate));

  const product = await prisma.product.create({
    data: {
      slug,
      ...productScalars(input),
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      translations: { create: translationRows(input.translations) },
      images: { create: normalizeImages(input.images) },
      categories: { create: unique(input.categoryIds).map((categoryId) => ({ categoryId })) },
      collections: { create: unique(input.collectionIds).map((collectionId) => ({ collectionId })) },
    },
    include: productInclude,
  });

  return serializeProductForAdmin(product);
};

export const updateProduct = async (id: number, input: ProductWriteInput, allowWithoutImage: boolean) => {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true, publishedAt: true } });
  if (!existing) throw ApiError.notFound('Product not found.');

  if (input.status === 'PUBLISHED') {
    const problems = validateForPublish(input, allowWithoutImage);
    if (problems.length > 0) throw ApiError.validation('This product cannot be published yet.', problems);
  }

  await Promise.all([assertSkuAvailable(input.sku.trim(), id), assertReferencesExist(input)]);

  const requestedSlug = input.slug ?? existing.slug;
  const slug =
    requestedSlug === existing.slug
      ? existing.slug
      : await uniqueSlug(requestedSlug, (candidate) => slugExists(candidate, id));

  const translations = translationRows(input.translations).map((row) => ({ ...row, productId: id }));
  const images = normalizeImages(input.images).map((image) => ({ ...image, productId: id }));
  const categories = unique(input.categoryIds).map((categoryId) => ({ productId: id, categoryId }));
  const collections = unique(input.collectionIds).map((collectionId) => ({ productId: id, collectionId }));

  /*
   * One batched transaction: the statements are applied atomically, and each
   * relation is rewritten with a single insert rather than one per row.
   *
   * This used to be an interactive `$transaction(async (tx) => …)`. Prisma
   * closes those after five seconds, and rewriting a product's relations took
   * about two dozen round trips. Against the remote production database that
   * outlasted the limit (P2028), so editing an existing product failed with
   * "Something went wrong" while creating one still worked.
   */
  await prisma.$transaction([
    prisma.productTranslation.deleteMany({ where: { productId: id } }),
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productCategory.deleteMany({ where: { productId: id } }),
    prisma.productCollection.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        slug,
        ...productScalars(input),
        // The first publication stamps publishedAt; later edits keep it.
        publishedAt: input.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
      },
      select: { id: true },
    }),
    ...(translations.length > 0 ? [prisma.productTranslation.createMany({ data: translations })] : []),
    ...(images.length > 0 ? [prisma.productImage.createMany({ data: images })] : []),
    ...(categories.length > 0 ? [prisma.productCategory.createMany({ data: categories })] : []),
    ...(collections.length > 0 ? [prisma.productCollection.createMany({ data: collections })] : []),
  ]);

  return getAdminProduct(id);
};

export const setProductStatus = async (id: number, status: ProductStatus) => {
  const existing = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!existing) throw ApiError.notFound('Product not found.');

  if (status === 'PUBLISHED') {
    const english = existing.translations.find((row) => row.locale === DEFAULT_LOCALE);
    const problems: PublishProblem[] = [];
    if (!english?.name) problems.push({ field: 'translations.en.name', message: 'An English product name is required.' });
    if (Number.parseFloat(existing.priceUsd.toString()) <= 0) {
      problems.push({ field: 'priceUsd', message: 'A USD price above zero is required.' });
    }
    if (existing.images.length === 0) {
      problems.push({ field: 'images', message: 'Add at least one product image before publishing.' });
    }
    if (problems.length > 0) throw ApiError.validation('This product cannot be published yet.', problems);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
    },
    include: productInclude,
  });

  return serializeProductForAdmin(product);
};

/** Soft delete by default — media is never destroyed implicitly. */
export const softDeleteProduct = async (id: number) => {
  const product = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'ARCHIVED' },
    select: { id: true, slug: true },
  });
  return product;
};

export const restoreProduct = async (id: number) =>
  prisma.product.update({ where: { id }, data: { deletedAt: null, status: 'DRAFT' }, select: { id: true } });

export const duplicateProduct = async (id: number) => {
  const source = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!source) throw ApiError.notFound('Product not found.');

  const slug = await uniqueSlug(`${source.slug}-copy`, (candidate) => slugExists(candidate));
  const sku = await (async () => {
    let candidate = `${source.sku}-COPY`;
    let suffix = 2;
    while (await prisma.product.findFirst({ where: { sku: candidate }, select: { id: true } })) {
      candidate = `${source.sku}-COPY${suffix}`;
      suffix += 1;
    }
    return candidate.slice(0, 64);
  })();

  const product = await prisma.product.create({
    data: {
      slug,
      sku,
      brandName: source.brandName,
      status: 'DRAFT',
      fragranceType: source.fragranceType,
      audience: source.audience,
      sizeMl: source.sizeMl,
      priceUsd: source.priceUsd,
      priceAed: source.priceAed,
      compareAtPriceUsd: source.compareAtPriceUsd,
      compareAtPriceAed: source.compareAtPriceAed,
      stockQuantity: 0,
      lowStockThreshold: source.lowStockThreshold,
      processingMinDays: source.processingMinDays,
      processingMaxDays: source.processingMaxDays,
      deliveryMinDays: source.deliveryMinDays,
      deliveryMaxDays: source.deliveryMaxDays,
      ingredients: source.ingredients,
      sortOrder: source.sortOrder,
      translations: {
        create: source.translations.map((row) => ({
          locale: row.locale,
          name: `${row.name} (copy)`,
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
      },
      images: {
        create: source.images.map((image) => ({
          mediaAssetId: image.mediaAssetId,
          isPrimary: image.isPrimary,
          sortOrder: image.sortOrder,
          altEn: image.altEn,
          altFr: image.altFr,
          altEs: image.altEs,
        })),
      },
      categories: { create: source.categories.map((row) => ({ categoryId: row.categoryId })) },
      collections: { create: source.collections.map((row) => ({ collectionId: row.collectionId })) },
    },
    include: productInclude,
  });

  return serializeProductForAdmin(product);
};

export const getAdminProduct = async (id: number) => {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw ApiError.notFound('Product not found.');
  return serializeProductForAdmin(product);
};

interface AdminListQuery {
  page: number;
  pageSize: number;
  q?: string;
  status?: ProductStatus;
  stock?: 'low' | 'out';
  featured?: 'true' | 'false';
  includeDeleted?: 'true' | 'false';
  sort: 'updated' | 'name' | 'sku' | 'price-asc' | 'price-desc' | 'stock';
}

export const listAdminProducts = async (query: AdminListQuery) => {
  const and: Prisma.ProductWhereInput[] = [];
  if (query.includeDeleted !== 'true') and.push({ deletedAt: null });
  if (query.status) and.push({ status: query.status });
  if (query.featured) and.push({ featured: query.featured === 'true' });
  if (query.stock === 'out') and.push({ stockQuantity: { lte: 0 } });
  if (query.stock === 'low') and.push({ stockQuantity: { gt: 0, lte: 5 } });
  if (query.q) {
    and.push({
      OR: [
        { sku: { contains: query.q } },
        { slug: { contains: query.q } },
        { translations: { some: { name: { contains: query.q } } } },
      ],
    });
  }

  const where: Prisma.ProductWhereInput = and.length > 0 ? { AND: and } : {};

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
    switch (query.sort) {
      case 'sku':
        return [{ sku: 'asc' }];
      case 'price-asc':
        return [{ priceUsd: 'asc' }];
      case 'price-desc':
        return [{ priceUsd: 'desc' }];
      case 'stock':
        return [{ stockQuantity: 'asc' }];
      case 'name':
        return [{ slug: 'asc' }];
      case 'updated':
      default:
        return [{ updatedAt: 'desc' }];
    }
  })();

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: rows.map(serializeProductForAdmin),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
};

/** Counters for the admin dashboard — all derived from real rows. */
export const getCatalogStats = async () => {
  const [published, draft, archived, outOfStock, lowStock, featured, bestseller, withoutImage] = await Promise.all([
    prisma.product.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    prisma.product.count({ where: { status: 'DRAFT', deletedAt: null } }),
    prisma.product.count({ where: { status: 'ARCHIVED', deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, stockQuantity: { lte: 0 } } }),
    prisma.product.count({ where: { deletedAt: null, stockQuantity: { gt: 0, lte: 5 } } }),
    prisma.product.count({ where: { deletedAt: null, featured: true } }),
    prisma.product.count({ where: { deletedAt: null, bestseller: true } }),
    prisma.product.count({ where: { deletedAt: null, status: 'PUBLISHED', images: { none: {} } } }),
  ]);

  return { published, draft, archived, outOfStock, lowStock, featured, bestseller, publishedWithoutImage: withoutImage };
};

export const listPublishedForSitemap = () =>
  prisma.product.findMany({
    where: PUBLIC_SCOPE,
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  });
