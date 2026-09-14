import { Router } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/http.js';
import { SUPPORTED_LOCALES } from '../lib/locale.js';
import { listPublishedForSitemap } from '../modules/products/service.js';
import { getSettings } from '../modules/settings/service.js';
import { listCollectionsForSitemap } from '../modules/taxonomy/service.js';
import { listLegalForSitemap } from '../modules/legal/service.js';

export const seoRouter = Router();

const STATIC_PATHS = ['', '/shop', '/collections', '/about', '/contact', '/faq'] as const;

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });

const siteBase = async () => {
  const settings = await getSettings();
  const configured = settings['site.publicUrl'].trim();
  return (configured || env.SITE_BASE_URL).replace(/\/+$/, '');
};

interface SitemapEntry {
  path: string;
  lastmod?: Date;
  priority: string;
  changefreq: string;
}

/**
 * Locale-aware sitemap. Drafts, archived and soft-deleted products, the bag,
 * the admin app and every private API route are excluded.
 */
const buildEntries = async (): Promise<SitemapEntry[]> => {
  const [products, collections, legal] = await Promise.all([
    listPublishedForSitemap(),
    listCollectionsForSitemap(),
    listLegalForSitemap(),
  ]);

  return [
    ...STATIC_PATHS.map((path) => ({
      path,
      priority: path === '' ? '1.0' : '0.8',
      changefreq: path === '' ? 'weekly' : 'weekly',
    })),
    ...collections.map((collection) => ({
      path: `/collections/${collection.slug}`,
      lastmod: collection.updatedAt,
      priority: '0.7',
      changefreq: 'weekly',
    })),
    ...products.map((product) => ({
      path: `/product/${product.slug}`,
      lastmod: product.updatedAt,
      priority: '0.9',
      changefreq: 'weekly',
    })),
    ...legal.map((page) => ({
      path: `/${page.slug}`,
      lastmod: page.updatedAt,
      priority: '0.3',
      changefreq: 'yearly',
    })),
  ];
};

seoRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const base = await siteBase();
    const entries = await buildEntries();

    const urls = entries
      .flatMap((entry) =>
        SUPPORTED_LOCALES.map((locale) => {
          const loc = `${base}/${locale}${entry.path}`;
          const alternates = SUPPORTED_LOCALES.map(
            (alternate) =>
              `    <xhtml:link rel="alternate" hreflang="${alternate}" href="${escapeXml(`${base}/${alternate}${entry.path}`)}" />`,
          ).join('\n');

          return [
            '  <url>',
            `    <loc>${escapeXml(loc)}</loc>`,
            alternates,
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${base}/en${entry.path}`)}" />`,
            entry.lastmod ? `    <lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>` : '',
            `    <changefreq>${entry.changefreq}</changefreq>`,
            `    <priority>${entry.priority}</priority>`,
            '  </url>',
          ]
            .filter(Boolean)
            .join('\n');
        }),
      )
      .join('\n');

    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
    );
  }),
);

seoRouter.get(
  '/robots.txt',
  asyncHandler(async (_req, res) => {
    const base = await siteBase();
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /admin',
        'Disallow: /*/bag',
        '',
        `Sitemap: ${base}/sitemap.xml`,
        '',
      ].join('\n'),
    );
  }),
);
