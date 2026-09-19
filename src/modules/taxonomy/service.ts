import { z } from 'zod';
import { ApiError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, mergeTranslation, type Locale } from '../../lib/locale.js';
import { uniqueSlug } from '../../lib/slug.js';

const optional = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) return null;
      const text = value.trim();
      return text === '' ? null : text.slice(0, max);
    });

export const categoryWriteSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and hyphens only.')
    .max(191)
    .optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isActive: z.boolean().optional().default(true),
  translations: z
    .array(
      z.object({
        locale: z.enum(SUPPORTED_LOCALES),
        name: z.string().trim().max(191),
        description: optional(5000),
        seoTitle: optional(191),
        seoDescription: optional(320),
      }),
    )
    .min(1),
});

export const collectionWriteSchema = categoryWriteSchema.extend({
  showOnHome: z.boolean().optional().default(true),
  translations: z
    .array(
      z.object({
        locale: z.enum(SUPPORTED_LOCALES),
        name: z.string().trim().max(191),
        tagline: optional(255),
        description: optional(5000),
        seoTitle: optional(191),
        seoDescription: optional(320),
      }),
    )
    .min(1),
});

export type CategoryWriteInput = z.infer<typeof categoryWriteSchema>;
export type CollectionWriteInput = z.infer<typeof collectionWriteSchema>;

const requireEnglishName = (translations: Array<{ locale: string; name: string }>) => {
  const english = translations.find((row) => row.locale === DEFAULT_LOCALE);
  if (!english || english.name.trim() === '') {
    throw ApiError.validation('An English name is required.', [
      { field: 'translations.en.name', message: 'An English name is required.' },
    ]);
  }
  return english.name.trim();
};

const keepNamed = <T extends { locale: string; name: string }>(translations: T[]) =>
  translations.filter((row) => row.locale === DEFAULT_LOCALE || row.name.trim() !== '');

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const listPublicCategories = async (locale: Locale) => {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      translations: true,
      _count: { select: { products: { where: { product: { status: 'PUBLISHED', deletedAt: null } } } } },
    },
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
  });

  return rows
    .filter((row) => row._count.products > 0)
    .map((row) => {
      const translation = mergeTranslation(row.translations, locale);
      return {
        slug: row.slug,
        name: translation?.name ?? row.slug,
        description: translation?.description ?? null,
        productCount: row._count.products,
      };
    });
};

export const listAdminCategories = async () => {
  const rows = await prisma.category.findMany({
    include: { translations: true, _count: { select: { products: true } } },
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    productCount: row._count.products,
    translations: row.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      description: translation.description,
      seoTitle: translation.seoTitle,
      seoDescription: translation.seoDescription,
    })),
  }));
};

export const createCategory = async (input: CategoryWriteInput) => {
  const englishName = requireEnglishName(input.translations);
  const slug = await uniqueSlug(input.slug ?? englishName, async (candidate) =>
    Boolean(await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );

  return prisma.category.create({
    data: {
      slug,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      translations: { create: keepNamed(input.translations) },
    },
    select: { id: true, slug: true },
  });
};

export const updateCategory = async (id: number, input: CategoryWriteInput) => {
  const existing = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) throw ApiError.notFound('Category not found.');
  const englishName = requireEnglishName(input.translations);

  const requested = input.slug ?? existing.slug;
  const slug =
    requested === existing.slug
      ? existing.slug
      : await uniqueSlug(requested || englishName, async (candidate) =>
          Boolean(await prisma.category.findFirst({ where: { slug: candidate, id: { not: id } }, select: { id: true } })),
        );

  return prisma.$transaction(async (tx) => {
    await tx.categoryTranslation.deleteMany({ where: { categoryId: id } });
    return tx.category.update({
      where: { id },
      data: {
        slug,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        translations: { create: keepNamed(input.translations) },
      },
      select: { id: true, slug: true },
    });
  });
};

export const deleteCategory = async (id: number) => {
  const usage = await prisma.productCategory.count({ where: { categoryId: id } });
  if (usage > 0) {
    throw ApiError.conflict(`This category is assigned to ${usage} product(s). Remove it from them first.`);
  }
  await prisma.category.delete({ where: { id } });
  return { id };
};

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export const listPublicCollections = async (locale: Locale, onlyHome = false) => {
  const rows = await prisma.collection.findMany({
    where: { isActive: true, ...(onlyHome ? { showOnHome: true } : {}) },
    include: {
      translations: true,
      _count: { select: { products: { where: { product: { status: 'PUBLISHED', deletedAt: null } } } } },
    },
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
  });

  return rows
    .filter((row) => row._count.products > 0)
    .map((row) => {
      const translation = mergeTranslation(row.translations, locale);
      return {
        slug: row.slug,
        name: translation?.name ?? row.slug,
        tagline: translation?.tagline ?? null,
        description: translation?.description ?? null,
        productCount: row._count.products,
      };
    });
};

/** How many products are live in the catalogue at all. */
const publishedProductCount = () => prisma.product.count({ where: { status: 'PUBLISHED', deletedAt: null } });

/**
 * Whether a collection page is worth indexing in its own right.
 *
 * A collection that holds every published product shows exactly what
 * `/collection` already shows, so indexing it would put two identical pages in
 * front of the same query — for each of the three languages. Such a page stays
 * live and crawlable but asks not to be indexed, and it is left out of the
 * sitemap.
 *
 * The test is on the selection itself rather than on a hand-maintained flag, so
 * the day a collection holds a genuine subset it becomes indexable with no code
 * change and no one having to remember.
 */
export const isDistinctSelection = (productCount: number, totalPublished: number): boolean =>
  productCount > 0 && productCount < totalPublished;

export const getPublicCollection = async (slug: string, locale: Locale) => {
  const [row, totalPublished] = await Promise.all([
    prisma.collection.findFirst({
      where: { slug, isActive: true },
      include: {
        translations: true,
        _count: { select: { products: { where: { product: { status: 'PUBLISHED', deletedAt: null } } } } },
      },
    }),
    publishedProductCount(),
  ]);
  if (!row) throw ApiError.notFound('Collection not found.');

  const translation = mergeTranslation(row.translations, locale);
  return {
    slug: row.slug,
    name: translation?.name ?? row.slug,
    tagline: translation?.tagline ?? null,
    description: translation?.description ?? null,
    seoTitle: translation?.seoTitle ?? null,
    seoDescription: translation?.seoDescription ?? translation?.tagline ?? null,
    productCount: row._count.products,
    indexable: isDistinctSelection(row._count.products, totalPublished),
  };
};

export const listAdminCollections = async () => {
  const rows = await prisma.collection.findMany({
    include: { translations: true, _count: { select: { products: true } } },
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    showOnHome: row.showOnHome,
    productCount: row._count.products,
    translations: row.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      tagline: translation.tagline,
      description: translation.description,
      seoTitle: translation.seoTitle,
      seoDescription: translation.seoDescription,
    })),
  }));
};

export const createCollection = async (input: CollectionWriteInput) => {
  const englishName = requireEnglishName(input.translations);
  const slug = await uniqueSlug(input.slug ?? englishName, async (candidate) =>
    Boolean(await prisma.collection.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );

  return prisma.collection.create({
    data: {
      slug,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      showOnHome: input.showOnHome,
      translations: { create: keepNamed(input.translations) },
    },
    select: { id: true, slug: true },
  });
};

export const updateCollection = async (id: number, input: CollectionWriteInput) => {
  const existing = await prisma.collection.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) throw ApiError.notFound('Collection not found.');
  const englishName = requireEnglishName(input.translations);

  const requested = input.slug ?? existing.slug;
  const slug =
    requested === existing.slug
      ? existing.slug
      : await uniqueSlug(requested || englishName, async (candidate) =>
          Boolean(
            await prisma.collection.findFirst({ where: { slug: candidate, id: { not: id } }, select: { id: true } }),
          ),
        );

  return prisma.$transaction(async (tx) => {
    await tx.collectionTranslation.deleteMany({ where: { collectionId: id } });
    return tx.collection.update({
      where: { id },
      data: {
        slug,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        showOnHome: input.showOnHome,
        translations: { create: keepNamed(input.translations) },
      },
      select: { id: true, slug: true },
    });
  });
};

export const deleteCollection = async (id: number) => {
  const usage = await prisma.productCollection.count({ where: { collectionId: id } });
  if (usage > 0) {
    throw ApiError.conflict(`This collection contains ${usage} product(s). Remove them from it first.`);
  }
  await prisma.collection.delete({ where: { id } });
  return { id };
};

/**
 * Collections a sitemap may name: active, holding published products, and
 * showing a genuine subset of the catalogue rather than a second copy of it
 * (see `isDistinctSelection`). A page that answers `noindex` is never listed.
 */
export const listCollectionsForSitemap = async () => {
  const [rows, totalPublished] = await Promise.all([
    prisma.collection.findMany({
      where: { isActive: true, products: { some: { product: { status: 'PUBLISHED', deletedAt: null } } } },
      select: {
        slug: true,
        updatedAt: true,
        _count: { select: { products: { where: { product: { status: 'PUBLISHED', deletedAt: null } } } } },
      },
    }),
    publishedProductCount(),
  ]);

  return rows
    .filter((row) => isDistinctSelection(row._count.products, totalPublished))
    .map((row) => ({ slug: row.slug, updatedAt: row.updatedAt }));
};
