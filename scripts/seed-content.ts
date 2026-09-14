/**
 * Seeds site settings, editorial copy, the starter taxonomy and the seven
 * legal pages in English, French and Spanish.
 *
 *   npm run seed:content
 *
 * Idempotent and non-destructive: existing rows are left alone unless
 * `--force` is passed, and NO products are ever created.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CATEGORY_SEED, COLLECTION_SEED, CONTENT_SEED } from './data/site-content.js';
import { LEGAL_EN } from './data/legal-en.js';
import { LEGAL_FR } from './data/legal-fr.js';
import { LEGAL_ES } from './data/legal-es.js';
import { CONTENT_BLOCKS } from '../src/modules/content/registry.js';
import { LEGAL_SLUGS } from '../src/modules/legal/service.js';
import {
  SETTING_DEFINITIONS,
  SETTING_KEYS,
  prismaTypeFor,
} from '../src/modules/settings/registry.js';

const prisma = new PrismaClient();
const force = process.argv.includes('--force');

const seedSettings = async () => {
  let created = 0;
  for (const key of SETTING_KEYS) {
    const definition = SETTING_DEFINITIONS[key];
    const existing = await prisma.siteSetting.findUnique({ where: { key } });
    if (existing && !force) continue;

    await prisma.siteSetting.upsert({
      where: { key },
      create: {
        key,
        value: definition.defaultValue,
        type: prismaTypeFor(definition.kind),
        isPublic: definition.isPublic,
        group: definition.group,
      },
      // `--force` resets metadata but never overwrites a value the business set.
      update: {
        type: prismaTypeFor(definition.kind),
        isPublic: definition.isPublic,
        group: definition.group,
      },
    });
    if (!existing) created += 1;
  }
  console.log(`  settings:    ${created} created, ${SETTING_KEYS.length - created} already present`);
};

const seedContent = async () => {
  let created = 0;
  let skipped = 0;

  for (const seed of CONTENT_SEED) {
    const definition = CONTENT_BLOCKS.find((block) => block.key === seed.key);
    if (!definition) {
      console.warn(`  ! content block "${seed.key}" is not in the registry — skipped`);
      continue;
    }

    const existing = await prisma.siteContent.findUnique({ where: { key: seed.key } });
    if (existing && !force) {
      skipped += 1;
      continue;
    }

    const record = await prisma.siteContent.upsert({
      where: { key: seed.key },
      create: { key: seed.key, group: definition.group, sortOrder: definition.sortOrder },
      update: { group: definition.group, sortOrder: definition.sortOrder },
    });

    await prisma.siteContentTranslation.deleteMany({ where: { siteContentId: record.id } });
    await prisma.siteContentTranslation.createMany({
      data: seed.translations.map((translation) => ({
        siteContentId: record.id,
        locale: translation.locale,
        eyebrow: translation.eyebrow ?? null,
        heading: translation.heading ?? null,
        subheading: translation.subheading ?? null,
        body: translation.body ?? null,
        ctaLabel: translation.ctaLabel ?? null,
        ctaHref: translation.ctaHref ?? null,
        ctaLabelAlt: translation.ctaLabelAlt ?? null,
        ctaHrefAlt: translation.ctaHrefAlt ?? null,
        items: translation.items ?? undefined,
      })),
    });
    created += 1;
  }

  console.log(`  content:     ${created} written, ${skipped} already present`);
};

const seedTaxonomy = async () => {
  let categories = 0;
  for (const seed of CATEGORY_SEED) {
    const existing = await prisma.category.findUnique({ where: { slug: seed.slug } });
    if (existing) continue;
    await prisma.category.create({
      data: {
        slug: seed.slug,
        sortOrder: seed.sortOrder,
        translations: {
          create: (Object.entries(seed.names) as Array<[string, string]>).map(([locale, name]) => ({ locale, name })),
        },
      },
    });
    categories += 1;
  }

  let collections = 0;
  for (const seed of COLLECTION_SEED) {
    const existing = await prisma.collection.findUnique({ where: { slug: seed.slug } });
    if (existing) continue;
    await prisma.collection.create({
      data: {
        slug: seed.slug,
        sortOrder: seed.sortOrder,
        translations: {
          create: (Object.entries(seed.names) as Array<[string, string]>).map(([locale, name]) => ({
            locale,
            name,
            tagline: seed.taglines[locale as keyof typeof seed.taglines] ?? null,
          })),
        },
      },
    });
    collections += 1;
  }

  console.log(`  taxonomy:    ${categories} categories, ${collections} collections created (empty containers)`);
};

const seedLegal = async () => {
  const bundles = { en: LEGAL_EN, fr: LEGAL_FR, es: LEGAL_ES };
  const today = new Date();
  let created = 0;
  let skipped = 0;

  for (const [index, slug] of LEGAL_SLUGS.entries()) {
    const existing = await prisma.legalPage.findUnique({ where: { slug } });
    if (existing && !force) {
      skipped += 1;
      continue;
    }

    const page = await prisma.legalPage.upsert({
      where: { slug },
      create: { slug, sortOrder: index * 10, isPublished: true, effectiveDate: today },
      update: { sortOrder: index * 10 },
    });

    await prisma.legalPageTranslation.deleteMany({ where: { legalPageId: page.id } });
    await prisma.legalPageTranslation.createMany({
      data: (Object.entries(bundles) as Array<[string, typeof LEGAL_EN]>)
        .filter(([, bundle]) => bundle[slug])
        .map(([locale, bundle]) => {
          const document = bundle[slug]!;
          return {
            legalPageId: page.id,
            locale,
            title: document.title,
            content: document.content,
            seoTitle: document.title,
            seoDescription: document.seoDescription,
          };
        }),
    });
    created += 1;
  }

  console.log(`  legal:       ${created} pages written, ${skipped} already present`);
};

const run = async () => {
  console.log(`\nMian Dubai — seeding site content${force ? ' (--force: overwriting seeded rows)' : ''}\n`);

  await seedSettings();
  await seedContent();
  await seedTaxonomy();
  await seedLegal();

  const productCount = await prisma.product.count();
  console.log(`\n  products:    ${productCount} (none are ever seeded — add real products in the admin)`);

  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) {
    console.log('\nNo administrator exists yet. Run:  npm run admin:create\n');
  } else {
    console.log('');
  }
};

run()
  .catch((error: unknown) => {
    console.error('\nSeeding failed.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
