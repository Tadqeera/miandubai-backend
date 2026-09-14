import { z } from 'zod';

export const SUPPORTED_LOCALES = ['en', 'fr', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);

export const normalizeLocale = (value: unknown): Locale => {
  if (typeof value !== 'string') return DEFAULT_LOCALE;
  const base = value.toLowerCase().split('-')[0] ?? '';
  return isLocale(base) ? base : DEFAULT_LOCALE;
};

/**
 * Returns the translation for `locale`, falling back to English and then to
 * whatever exists. French and Spanish rows are optional by design.
 */
export const pickTranslation = <T extends { locale: string }>(
  translations: readonly T[],
  locale: Locale,
): T | undefined =>
  translations.find((row) => row.locale === locale) ??
  translations.find((row) => row.locale === DEFAULT_LOCALE) ??
  translations[0];

/**
 * Merges the requested locale over English so partially translated rows still
 * render complete content instead of blank fields.
 */
export const mergeTranslation = <T extends { locale: string }>(
  translations: readonly T[],
  locale: Locale,
): T | undefined => {
  const base = translations.find((row) => row.locale === DEFAULT_LOCALE) ?? translations[0];
  if (!base) return undefined;
  if (locale === DEFAULT_LOCALE) return base;
  const target = translations.find((row) => row.locale === locale);
  if (!target) return base;

  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(target)) {
    if (value !== null && value !== undefined && value !== '') merged[key] = value;
  }
  merged.locale = locale;
  return merged as T;
};
