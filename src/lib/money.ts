import type { Prisma } from '@prisma/client';

export type Currency = 'USD' | 'AED';
export const CURRENCIES: readonly Currency[] = ['USD', 'AED'] as const;

type DecimalLike = Prisma.Decimal | string | number | null | undefined;

/**
 * All money arithmetic runs on integer minor units (cents / fils). Decimal
 * values from Prisma arrive as strings and are parsed without ever touching
 * binary floating point addition.
 */
export const toMinorUnits = (value: DecimalLike): number | null => {
  if (value === null || value === undefined) return null;
  const text = typeof value === 'object' ? value.toString() : String(value);
  const match = /^(-?)(\d+)(?:\.(\d{1,}))?$/.exec(text.trim());
  if (!match) return null;
  const [, sign, whole, fraction = ''] = match;
  const cents = `${fraction}00`.slice(0, 2);
  const minor = Number.parseInt(`${whole}${cents}`, 10);
  if (!Number.isFinite(minor)) return null;
  return sign === '-' ? -minor : minor;
};

export const fromMinorUnits = (minor: number | null): string | null => {
  if (minor === null || !Number.isFinite(minor)) return null;
  const negative = minor < 0;
  const abs = Math.abs(Math.round(minor));
  const text = `${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
  return negative ? `-${text}` : text;
};

/**
 * Converts a USD amount to AED using a fixed, admin-configured rate.
 * Banker-free half-up rounding on integer minor units.
 */
export const convertUsdToAed = (usdMinor: number | null, aedPerUsd: number): number | null => {
  if (usdMinor === null) return null;
  if (!Number.isFinite(aedPerUsd) || aedPerUsd <= 0) return null;
  // Scale the rate to 6 decimal places so the multiplication stays integral.
  const scaledRate = Math.round(aedPerUsd * 1_000_000);
  return Math.round((usdMinor * scaledRate) / 1_000_000);
};

export const sumMinorUnits = (values: Array<number | null>): number =>
  values.reduce<number>((total, value) => total + (value ?? 0), 0);
