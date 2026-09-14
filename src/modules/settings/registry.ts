import type { SettingType } from '@prisma/client';

export type SettingKind = 'string' | 'text' | 'number' | 'boolean';

export interface SettingDefinition {
  readonly kind: SettingKind;
  readonly defaultValue: string;
  /** Public settings are the only ones served by GET /api/v1/site/public. */
  readonly isPublic: boolean;
  readonly group: string;
  readonly label: string;
  readonly help?: string;
}

const define = <T extends Record<string, SettingDefinition>>(definitions: T): T => definitions;

/**
 * Single source of truth for every site setting. Nothing outside this file may
 * invent a raw setting key — `getSettings()` returns a typed snapshot.
 *
 * Anything the business has not supplied stays EMPTY on purpose. The storefront
 * hides the components that depend on a missing optional setting rather than
 * rendering invented contact details.
 */
export const SETTING_DEFINITIONS = define({
  'brand.displayName': {
    kind: 'string',
    defaultValue: 'Mian Dubai',
    isPublic: true,
    group: 'brand',
    label: 'Brand display name',
  },
  'brand.legalEntityName': {
    kind: 'string',
    defaultValue: '',
    isPublic: true,
    group: 'brand',
    label: 'Registered legal entity name',
    help: 'Leave empty until the registered company name exists. Legal pages then refer to "Mian Dubai" only.',
  },

  'contact.whatsappNumber': {
    kind: 'string',
    defaultValue: '',
    isPublic: true,
    group: 'contact',
    label: 'WhatsApp number',
    help: 'Full international number, e.g. +1 555 000 0000. WhatsApp actions stay hidden while this is empty.',
  },
  'contact.supportEmail': {
    kind: 'string',
    defaultValue: '',
    isPublic: true,
    group: 'contact',
    label: 'Support email address',
  },
  'contact.phone': {
    kind: 'string',
    defaultValue: '',
    isPublic: true,
    group: 'contact',
    label: 'Contact telephone',
  },
  'contact.businessAddress': {
    kind: 'text',
    defaultValue: '',
    isPublic: true,
    group: 'contact',
    label: 'Business address',
    help: 'Shown on the contact page and in legal pages once supplied.',
  },

  'site.publicUrl': {
    kind: 'string',
    defaultValue: '',
    isPublic: true,
    group: 'site',
    label: 'Public website URL',
    help: 'Used for canonical URLs, hreflang and sitemap.xml. Falls back to SITE_BASE_URL.',
  },

  'social.instagramUrl': { kind: 'string', defaultValue: '', isPublic: true, group: 'social', label: 'Instagram URL' },
  'social.tiktokUrl': { kind: 'string', defaultValue: '', isPublic: true, group: 'social', label: 'TikTok URL' },
  'social.facebookUrl': { kind: 'string', defaultValue: '', isPublic: true, group: 'social', label: 'Facebook URL' },

  'shipping.region': {
    kind: 'string',
    defaultValue: 'California, United States',
    isPublic: true,
    group: 'shipping',
    label: 'Current delivery region',
  },
  'shipping.deliveryMinDays': {
    kind: 'number',
    defaultValue: '2',
    isPublic: true,
    group: 'shipping',
    label: 'Estimated delivery — minimum business days',
  },
  'shipping.deliveryMaxDays': {
    kind: 'number',
    defaultValue: '5',
    isPublic: true,
    group: 'shipping',
    label: 'Estimated delivery — maximum business days',
  },
  'shipping.freeShippingEnabled': {
    kind: 'boolean',
    defaultValue: 'false',
    isPublic: true,
    group: 'shipping',
    label: 'Advertise free shipping',
    help: 'Only enable this once free shipping is actually offered.',
  },
  'shipping.freeShippingThresholdUsd': {
    kind: 'number',
    defaultValue: '0',
    isPublic: true,
    group: 'shipping',
    label: 'Free shipping threshold (USD)',
  },

  'returns.windowDays': {
    kind: 'number',
    defaultValue: '14',
    isPublic: true,
    group: 'returns',
    label: 'Return request window (days)',
  },

  'currency.default': {
    kind: 'string',
    defaultValue: 'USD',
    isPublic: true,
    group: 'currency',
    label: 'Default currency (USD or AED)',
  },
  'currency.aedPerUsd': {
    kind: 'number',
    defaultValue: '3.6725',
    isPublic: true,
    group: 'currency',
    label: 'AED per USD fallback rate',
    help: 'Used only when a product has no explicit AED price. No live exchange-rate API is called.',
  },

  'announcement.enabled': {
    kind: 'boolean',
    defaultValue: 'true',
    isPublic: true,
    group: 'appearance',
    label: 'Show announcement bar',
    help: 'The announcement text itself is edited per language under Homepage content.',
  },

  'newsletter.enabled': {
    kind: 'boolean',
    defaultValue: 'true',
    isPublic: true,
    group: 'features',
    label: 'Enable newsletter sign-up',
  },

  'product.showSku': {
    kind: 'boolean',
    defaultValue: 'true',
    isPublic: true,
    group: 'catalog',
    label: 'Show SKU on product pages',
  },
  'product.showStockCount': {
    kind: 'boolean',
    defaultValue: 'false',
    isPublic: true,
    group: 'catalog',
    label: 'Show exact stock quantity to customers',
  },

  'seo.defaultTitle': {
    kind: 'string',
    defaultValue: 'Mian Dubai — Luxury Fragrance',
    isPublic: true,
    group: 'seo',
    label: 'Default SEO title',
  },
  'seo.defaultDescription': {
    kind: 'text',
    defaultValue:
      'Mian Dubai is a luxury fragrance house. Discover our collection and order with the assistance of our fragrance concierge.',
    isPublic: true,
    group: 'seo',
    label: 'Default SEO description',
  },
  'seo.ogImageUrl': {
    kind: 'string',
    defaultValue: '',
    isPublic: true,
    group: 'seo',
    label: 'Default social sharing image URL',
  },

  'legal.governingLawState': {
    kind: 'string',
    defaultValue: 'California',
    isPublic: true,
    group: 'legal',
    label: 'Governing law — state',
  },
  'legal.governingLawVenue': {
    kind: 'string',
    defaultValue: '',
    isPublic: true,
    group: 'legal',
    label: 'Governing law — county / venue',
    help: 'Leave empty until confirmed. Legal pages omit the venue clause while this is blank.',
  },
  'legal.privacyContactEmail': {
    kind: 'string',
    defaultValue: '',
    isPublic: true,
    group: 'legal',
    label: 'Privacy request email',
    help: 'Falls back to the support email when empty.',
  },
} satisfies Record<string, SettingDefinition>);

export type SettingKey = keyof typeof SETTING_DEFINITIONS;

export const SETTING_KEYS = Object.keys(SETTING_DEFINITIONS) as SettingKey[];

export const PUBLIC_SETTING_KEYS = SETTING_KEYS.filter((key) => SETTING_DEFINITIONS[key].isPublic);

export const prismaTypeFor = (kind: SettingKind): SettingType => {
  switch (kind) {
    case 'text':
      return 'TEXT';
    case 'number':
      return 'NUMBER';
    case 'boolean':
      return 'BOOLEAN';
    default:
      return 'STRING';
  }
};

type KindToValue = {
  string: string;
  text: string;
  number: number;
  boolean: boolean;
};

export type SettingValues = {
  [K in SettingKey]: KindToValue[(typeof SETTING_DEFINITIONS)[K]['kind']];
};

export const parseSettingValue = <K extends SettingKey>(key: K, raw: string | null | undefined): SettingValues[K] => {
  const definition = SETTING_DEFINITIONS[key];
  const value = raw === null || raw === undefined ? definition.defaultValue : raw;

  switch (definition.kind) {
    case 'number': {
      const parsed = Number.parseFloat(value);
      const fallback = Number.parseFloat(definition.defaultValue);
      return (Number.isFinite(parsed) ? parsed : fallback) as SettingValues[K];
    }
    case 'boolean':
      return (['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase()) as unknown) as SettingValues[K];
    default:
      return value as SettingValues[K];
  }
};

export const serializeSettingValue = (kind: SettingKind, value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (kind === 'boolean') return value === true || value === 'true' ? 'true' : 'false';
  return String(value);
};
