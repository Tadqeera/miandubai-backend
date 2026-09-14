import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { getMediaUsage } from '../media/service.js';
import { getCatalogStats } from '../products/service.js';
import { getRecentMessages } from '../contact/service.js';
import { getSettings } from '../settings/service.js';
import { LEGAL_SLUGS } from '../legal/service.js';
import { getWhatsAppClickCounts } from '../whatsapp/service.js';

export interface GoLiveItem {
  id: string;
  label: string;
  ok: boolean;
  severity: 'required' | 'recommended';
  hint: string;
}

/**
 * Advisory only — nothing here blocks local development. It exists so the
 * business does not go live with an unreachable WhatsApp number or an empty
 * catalog.
 */
export const buildGoLiveChecklist = async (): Promise<GoLiveItem[]> => {
  const settings = await getSettings();

  const [publishedCount, publishedWithImage, legalPublished] = await Promise.all([
    prisma.product.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    prisma.product.count({ where: { status: 'PUBLISHED', deletedAt: null, images: { some: {} } } }),
    prisma.legalPage.count({ where: { isPublished: true, translations: { some: { locale: 'en' } } } }),
  ]);

  return [
    {
      id: 'whatsapp',
      label: 'WhatsApp number configured',
      ok: settings['contact.whatsappNumber'].trim().length >= 8,
      severity: 'required',
      hint: 'Every WhatsApp ordering action stays hidden until this is set. Settings → Contact.',
    },
    {
      id: 'supportEmail',
      label: 'Support email configured',
      ok: settings['contact.supportEmail'].trim() !== '',
      severity: 'required',
      hint: 'Used on the contact page and in the privacy policy. Settings → Contact.',
    },
    {
      id: 'publishedProduct',
      label: 'At least one published product',
      ok: publishedCount > 0,
      severity: 'required',
      hint: 'The storefront shows a branded empty state until a product is published.',
    },
    {
      id: 'productImages',
      label: 'Every published product has an image',
      ok: publishedCount === 0 || publishedWithImage === publishedCount,
      severity: 'required',
      hint: `${publishedCount - publishedWithImage} published product(s) have no image.`,
    },
    {
      id: 'legal',
      label: 'Legal policies published',
      ok: legalPublished >= LEGAL_SLUGS.length,
      severity: 'required',
      hint: `${legalPublished} of ${LEGAL_SLUGS.length} policies are published. Review the seeded starter text before going live.`,
    },
    {
      id: 'siteUrl',
      label: 'Public website URL configured',
      ok: settings['site.publicUrl'].trim() !== '',
      severity: 'required',
      hint: `Canonical URLs and sitemap.xml currently fall back to ${env.SITE_BASE_URL}. Settings → Site.`,
    },
    {
      id: 'delivery',
      label: 'Delivery estimate configured',
      ok: settings['shipping.deliveryMinDays'] > 0 && settings['shipping.deliveryMaxDays'] >= settings['shipping.deliveryMinDays'],
      severity: 'required',
      hint: 'Settings → Shipping. Change this immediately if the estimate can no longer be met.',
    },
    {
      id: 'returnWindow',
      label: 'Return window configured',
      ok: settings['returns.windowDays'] > 0,
      severity: 'required',
      hint: 'Settings → Returns. The returns policy quotes this number.',
    },
    {
      id: 'legalEntity',
      label: 'Registered legal entity name',
      ok: settings['brand.legalEntityName'].trim() !== '',
      severity: 'recommended',
      hint: 'Optional. While empty, legal pages refer to "Mian Dubai" rather than claiming a company form.',
    },
    {
      id: 'governingVenue',
      label: 'Governing-law venue confirmed',
      ok: settings['legal.governingLawVenue'].trim() !== '',
      severity: 'recommended',
      hint: 'Optional. The venue clause is omitted while this is blank rather than naming an invented county.',
    },
    {
      id: 'social',
      label: 'At least one social channel',
      ok: [settings['social.instagramUrl'], settings['social.tiktokUrl'], settings['social.facebookUrl']].some(
        (url) => url.trim() !== '',
      ),
      severity: 'recommended',
      hint: 'Footer social icons are hidden while all three are empty.',
    },
  ];
};

export const getDashboardSummary = async () => {
  const [catalog, media, messages, recentMessages, subscribers, settings, whatsapp] = await Promise.all([
    getCatalogStats(),
    getMediaUsage(),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
    getRecentMessages(5),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    getSettings(),
    getWhatsAppClickCounts(),
  ]);

  const checklist = await buildGoLiveChecklist();

  return {
    catalog,
    media,
    messages: {
      unread: messages,
      recent: recentMessages.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    },
    subscribers: { active: subscribers, enabled: settings['newsletter.enabled'] && env.FEATURE_NEWSLETTER },
    // Clicks on WhatsApp ordering actions. Not contacts — a wa.me link never
    // reveals the visitor's own number.
    whatsapp,
    goLive: {
      items: checklist,
      outstandingRequired: checklist.filter((item) => item.severity === 'required' && !item.ok).length,
    },
    storage: {
      driver: env.MEDIA_STORAGE_DRIVER,
      external: true,
      servedBy: env.servesMediaLocally ? 'backend' : env.MEDIA_PUBLIC_URL,
    },
  };
};
