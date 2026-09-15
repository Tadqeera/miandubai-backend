import { Router, type Response } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/http.js';
import { SUPPORTED_LOCALES } from '../lib/locale.js';
import { listPublishedForSitemap } from '../modules/products/service.js';
import { getSettings } from '../modules/settings/service.js';
import { listCollectionsForSitemap } from '../modules/taxonomy/service.js';
import { listLegalForSitemap } from '../modules/legal/service.js';

export const seoRouter = Router();

/**
 * Canonical storefront pages. Redirecting paths (`/shop`, `/collections`) are
 * never listed: a sitemap should only name URLs that answer 200 themselves.
 * Journal articles live in the storefront build, which lists them in its own
 * `sitemap-pages.xml`.
 */
const STATIC_PATHS = ['', '/collection', '/about', '/contact', '/faq', '/legal', '/blog'] as const;

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

const staticEntries = (): SitemapEntry[] =>
  STATIC_PATHS.map((path) => ({ path, priority: path === '' ? '1.0' : '0.8', changefreq: 'weekly' }));

/**
 * Database-driven pages only. Drafts, archived and soft-deleted products, the
 * bag, the admin app and every private API route are excluded.
 */
const catalogEntries = async (): Promise<SitemapEntry[]> => {
  const [products, collections, legal] = await Promise.all([
    listPublishedForSitemap(),
    listCollectionsForSitemap(),
    listLegalForSitemap(),
  ]);

  return [
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

/** One `<url>` per locale, each naming every language version plus x-default. */
const renderUrlset = (base: string, entries: SitemapEntry[]) => {
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

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
};

/** Short shared caching: a new product appears within the hour without hammering the database. */
const sendXml = (res: Response, xml: string) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.type('application/xml').send(xml);
};

/** Every public page, for direct submission of the API-hosted sitemap. */
seoRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const [base, catalog] = await Promise.all([siteBase(), catalogEntries()]);
    sendXml(res, renderUrlset(base, [...staticEntries(), ...catalog]));
  }),
);

/**
 * Products, collections and policies only. The storefront's `/sitemap.xml` is
 * a sitemap index that proxies this file alongside its own build-time list of
 * static pages and journal articles, so nothing is listed twice.
 */
seoRouter.get(
  '/sitemap-catalog.xml',
  asyncHandler(async (_req, res) => {
    const [base, catalog] = await Promise.all([siteBase(), catalogEntries()]);
    sendXml(res, renderUrlset(base, catalog));
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
