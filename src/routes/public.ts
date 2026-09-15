import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler, hashIp } from '../lib/http.js';
import { localeSchema, normalizeLocale } from '../lib/locale.js';
import { contactLimiter, eventLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { contactSubmitSchema, submitContactMessage } from '../modules/contact/service.js';
import { getContentBlock, getContentBundle } from '../modules/content/service.js';
import { getPublicLegalPage, listPublicLegalPages } from '../modules/legal/service.js';
import { newsletterSubscribeSchema, subscribe } from '../modules/newsletter/service.js';
import {
  availabilityQuerySchema,
  productSlugParamsSchema,
  publicProductQuerySchema,
  searchQuerySchema,
} from '../modules/products/schemas.js';
import {
  checkAvailability,
  getPublicFacets,
  getPublicProductBySlug,
  getRelatedProducts,
  listPublicProducts,
  searchProducts,
} from '../modules/products/service.js';
import { getPublicSettings } from '../modules/settings/service.js';
import { recordWhatsAppInteraction, whatsappEventSchema } from '../modules/whatsapp/service.js';
import {
  getPublicCollection,
  listPublicCategories,
  listPublicCollections,
} from '../modules/taxonomy/service.js';

export const publicRouter = Router();

const localeQuery = z.object({ locale: localeSchema.optional().default('en') });

publicRouter.get(
  '/site/public',
  asyncHandler(async (req, res) => {
    const locale = normalizeLocale(req.query.locale);
    const [settings, content, legalPages] = await Promise.all([
      getPublicSettings(),
      getContentBundle(locale),
      listPublicLegalPages(locale),
    ]);

    res.json({
      data: {
        settings,
        content,
        legalPages,
        features: {
          // Feature flags gate the UI; the endpoint below enforces them again.
          newsletter: env.FEATURE_NEWSLETTER && settings['newsletter.enabled'] === true,
        },
        locales: ['en', 'fr', 'es'],
      },
    });
  }),
);

publicRouter.get(
  '/content/:key',
  asyncHandler(async (req, res) => {
    const locale = normalizeLocale(req.query.locale);
    const key = String(req.params.key ?? '');
    res.json({ data: await getContentBlock(key, locale) });
  }),
);

publicRouter.get(
  '/products',
  validate(publicProductQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json({ data: await listPublicProducts(req.query as never) });
  }),
);

publicRouter.get(
  '/products/facets',
  asyncHandler(async (_req, res) => {
    res.json({ data: await getPublicFacets() });
  }),
);

publicRouter.get(
  '/products/search',
  validate(searchQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { q, locale, limit } = req.query as unknown as z.infer<typeof searchQuerySchema>;
    res.json({ data: { items: await searchProducts(q, locale, limit) } });
  }),
);

publicRouter.get(
  '/products/availability',
  validate(availabilityQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { slugs, locale } = req.query as unknown as z.infer<typeof availabilityQuerySchema>;
    res.json({ data: { items: await checkAvailability(slugs, locale) } });
  }),
);

publicRouter.get(
  '/products/:slug',
  validate(productSlugParamsSchema, 'params'),
  validate(localeQuery, 'query'),
  asyncHandler(async (req, res) => {
    const locale = normalizeLocale((req.query as { locale?: string }).locale);
    res.json({ data: await getPublicProductBySlug(String(req.params.slug), locale) });
  }),
);

publicRouter.get(
  '/products/:slug/related',
  validate(productSlugParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const locale = normalizeLocale(req.query.locale);
    res.json({ data: { items: await getRelatedProducts(String(req.params.slug), locale) } });
  }),
);

publicRouter.get(
  '/categories',
  asyncHandler(async (req, res) => {
    res.json({ data: { items: await listPublicCategories(normalizeLocale(req.query.locale)) } });
  }),
);

publicRouter.get(
  '/collections',
  asyncHandler(async (req, res) => {
    const onlyHome = req.query.home === 'true';
    res.json({ data: { items: await listPublicCollections(normalizeLocale(req.query.locale), onlyHome) } });
  }),
);

publicRouter.get(
  '/collections/:slug',
  asyncHandler(async (req, res) => {
    res.json({ data: await getPublicCollection(String(req.params.slug), normalizeLocale(req.query.locale)) });
  }),
);

publicRouter.get(
  '/legal',
  asyncHandler(async (req, res) => {
    res.json({ data: { items: await listPublicLegalPages(normalizeLocale(req.query.locale)) } });
  }),
);

publicRouter.get(
  '/legal/:slug',
  asyncHandler(async (req, res) => {
    res.json({ data: await getPublicLegalPage(String(req.params.slug), normalizeLocale(req.query.locale)) });
  }),
);

publicRouter.post(
  '/contact',
  contactLimiter,
  validate(contactSubmitSchema),
  asyncHandler(async (req, res) => {
    const result = await submitContactMessage(req.body as never, {
      ipHash: hashIp(req),
      userAgent: req.get('user-agent'),
    });
    // Messages are stored regardless of whether SMTP is configured; the second
    // flag says whether the visitor's confirmation email was actually sent.
    res.status(201).json({ data: { accepted: result.accepted, confirmationEmailSent: result.confirmationEmailSent } });
  }),
);

/**
 * Records that a WhatsApp ordering action was pressed. Fires from a click
 * handler, so it answers 202 without waiting for anything the visitor needs,
 * and a failure here must never stop the WhatsApp link from opening.
 */
publicRouter.post(
  '/whatsapp-events',
  eventLimiter,
  validate(whatsappEventSchema),
  asyncHandler(async (req, res) => {
    await recordWhatsAppInteraction(req.body as never, hashIp(req));
    res.status(202).json({ data: { recorded: true } });
  }),
);

publicRouter.post(
  '/newsletter',
  contactLimiter,
  validate(newsletterSubscribeSchema),
  asyncHandler(async (req, res) => {
    if (!env.FEATURE_NEWSLETTER) {
      throw ApiError.notFound('The newsletter is not available.');
    }
    const settings = await getPublicSettings();
    if (settings['newsletter.enabled'] !== true) {
      throw ApiError.notFound('The newsletter is not available.');
    }
    res.status(201).json({ data: await subscribe(req.body as never, hashIp(req)) });
  }),
);
