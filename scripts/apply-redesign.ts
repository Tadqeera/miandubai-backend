/**
 * Applies the confirmed business contact details and the redesigned editorial
 * copy to an existing database.
 *
 *   npm run apply:redesign
 *
 * What it touches:
 *   - the four settings the business has now confirmed
 *   - the editorial content blocks whose copy changed in the redesign
 *
 * What it never touches: products, product images, media assets, media files,
 * legal page content, administrators, messages or migrations. It is safe to run
 * more than once.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CONTENT_SEED } from './data/site-content.js';
import { CONTENT_BLOCKS } from '../src/modules/content/registry.js';
import { SETTING_DEFINITIONS, prismaTypeFor, type SettingKey } from '../src/modules/settings/registry.js';

const prisma = new PrismaClient();

/** Confirmed by the business. Nothing here is invented or a placeholder. */
const CONFIRMED_SETTINGS: Partial<Record<SettingKey, string>> = {
  'contact.whatsappNumber': '+1 510 220 0094',
  'contact.phone': '+1 510 220 0094',
  'contact.supportEmail': 'contact@miandubai.com',
  'legal.privacyContactEmail': 'contact@miandubai.com',
  // The public newsletter was removed from the storefront in this redesign.
  // The table and endpoints remain; the feature is simply switched off.
  'newsletter.enabled': 'false',
};

/** Blocks whose copy the redesign replaces. Anything absent is left alone. */
const REFRESHED_CONTENT_KEYS = [
  'announcement',
  'home.hero',
  'home.featured',
  'home.scentArchitecture',
  'home.promises',
  'about.craft',
  'legal.intro',
  'footer.brand',
];

const applySettings = async () => {
  const changes: string[] = [];

  for (const [key, value] of Object.entries(CONFIRMED_SETTINGS) as Array<[SettingKey, string]>) {
    const definition = SETTING_DEFINITIONS[key];
    const existing = await prisma.siteSetting.findUnique({ where: { key } });

    if (existing?.value === value) continue;

    await prisma.siteSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        type: prismaTypeFor(definition.kind),
        isPublic: definition.isPublic,
        group: definition.group,
      },
      update: { value },
    });
    changes.push(`${key} = ${value}`);
  }

  console.log(`  settings:    ${changes.length} updated`);
  for (const change of changes) console.log(`               · ${change}`);
};

const applyContent = async () => {
  let written = 0;

  for (const key of REFRESHED_CONTENT_KEYS) {
    const seed = CONTENT_SEED.find((entry) => entry.key === key);
    const definition = CONTENT_BLOCKS.find((block) => block.key === key);

    if (!seed || !definition) {
      console.warn(`  ! "${key}" is missing from the seed or the registry — skipped`);
      continue;
    }

    const record = await prisma.siteContent.upsert({
      where: { key },
      create: { key, group: definition.group, sortOrder: definition.sortOrder },
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
    written += 1;
  }

  console.log(`  content:     ${written} block(s) refreshed in en / fr / es`);
};

const run = async () => {
  console.log('\nMian Dubai — applying redesign settings and copy\n');

  await applySettings();
  await applyContent();

  const [products, media] = await Promise.all([prisma.product.count(), prisma.mediaAsset.count()]);
  console.log(`\n  untouched:   ${products} product(s), ${media} media asset(s)\n`);
};

run()
  .catch((error: unknown) => {
    console.error('\nFailed to apply the redesign content.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
