import { prisma } from '../../lib/prisma.js';
import {
  PUBLIC_SETTING_KEYS,
  SETTING_DEFINITIONS,
  SETTING_KEYS,
  parseSettingValue,
  prismaTypeFor,
  serializeSettingValue,
  type SettingKey,
  type SettingValues,
} from './registry.js';

const CACHE_TTL_MS = 15_000;

let cache: { values: SettingValues; expiresAt: number } | null = null;

export const invalidateSettingsCache = () => {
  cache = null;
};

const buildValues = (rows: Array<{ key: string; value: string | null }>): SettingValues => {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const values = {} as Record<SettingKey, unknown>;
  for (const key of SETTING_KEYS) {
    values[key] = parseSettingValue(key, byKey.get(key));
  }
  return values as SettingValues;
};

/** Typed, cached access to every site setting. */
export const getSettings = async (): Promise<SettingValues> => {
  if (cache && cache.expiresAt > Date.now()) return cache.values;
  const rows = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
  const values = buildValues(rows);
  cache = { values, expiresAt: Date.now() + CACHE_TTL_MS };
  return values;
};

export const getSetting = async <K extends SettingKey>(key: K): Promise<SettingValues[K]> => {
  const settings = await getSettings();
  return settings[key];
};

/** Public snapshot — never includes non-public keys or infrastructure secrets. */
export const getPublicSettings = async () => {
  const settings = await getSettings();
  const result = {} as Record<string, unknown>;
  for (const key of PUBLIC_SETTING_KEYS) {
    result[key] = settings[key];
  }
  return result;
};

export const listSettingsForAdmin = async () => {
  const settings = await getSettings();
  return SETTING_KEYS.map((key) => ({
    key,
    value: settings[key],
    ...SETTING_DEFINITIONS[key],
  }));
};

export const updateSettings = async (patch: Partial<Record<SettingKey, unknown>>) => {
  const entries = Object.entries(patch).filter(([key]) => SETTING_KEYS.includes(key as SettingKey)) as Array<
    [SettingKey, unknown]
  >;
  if (entries.length === 0) return [];

  await prisma.$transaction(
    entries.map(([key, value]) => {
      const definition = SETTING_DEFINITIONS[key];
      const serialized = serializeSettingValue(definition.kind, value);
      return prisma.siteSetting.upsert({
        where: { key },
        create: {
          key,
          value: serialized,
          type: prismaTypeFor(definition.kind),
          isPublic: definition.isPublic,
          group: definition.group,
        },
        update: { value: serialized, type: prismaTypeFor(definition.kind), isPublic: definition.isPublic, group: definition.group },
      });
    }),
  );

  invalidateSettingsCache();
  return entries.map(([key]) => key);
};

/** Creates any missing setting rows using registry defaults. Idempotent. */
export const ensureSettingRows = async () => {
  const existing = await prisma.siteSetting.findMany({ select: { key: true } });
  const known = new Set(existing.map((row) => row.key));
  const missing = SETTING_KEYS.filter((key) => !known.has(key));
  if (missing.length === 0) return 0;

  await prisma.siteSetting.createMany({
    data: missing.map((key) => {
      const definition = SETTING_DEFINITIONS[key];
      return {
        key,
        value: definition.defaultValue,
        type: prismaTypeFor(definition.kind),
        isPublic: definition.isPublic,
        group: definition.group,
      };
    }),
  });

  invalidateSettingsCache();
  return missing.length;
};
