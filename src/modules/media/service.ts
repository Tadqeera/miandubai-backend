import type { MediaAsset, Prisma } from '@prisma/client';
import { ApiError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { storage } from '../../storage/index.js';
import { processProductImage, sanitizeOriginalFilename, type ProcessedVariant } from './imageProcessing.js';

export interface MediaVariantDto {
  width: number;
  url: string;
}

export interface MediaDto {
  id: number;
  uuid: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  srcSet: string | null;
  variants: MediaVariantDto[];
  createdAt: string;
}

const isVariant = (entry: unknown): entry is ProcessedVariant => {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return false;
  const candidate = entry as Record<string, unknown>;
  return typeof candidate.key === 'string' && typeof candidate.width === 'number';
};

const readVariants = (value: Prisma.JsonValue | null): ProcessedVariant[] => {
  if (!Array.isArray(value)) return [];
  return (value as unknown[]).filter(isVariant);
};

/**
 * The public URL is derived from MEDIA_PUBLIC_URL at read time, so moving the
 * media host never requires a data migration. `publicUrl` on the row is only
 * an explicit override.
 */
export const serializeMedia = (asset: MediaAsset): MediaDto => {
  const variants = readVariants(asset.variants)
    .map((variant) => ({ width: variant.width, url: storage.getPublicUrl(variant.key) }))
    .sort((a, b) => a.width - b.width);

  return {
    id: asset.id,
    uuid: asset.uuid,
    url: asset.publicUrl ?? storage.getPublicUrl(asset.storageKey),
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    originalFilename: asset.originalFilename,
    srcSet: variants.length > 0 ? variants.map((variant) => `${variant.url} ${variant.width}w`).join(', ') : null,
    variants,
    createdAt: asset.createdAt.toISOString(),
  };
};

export const createMediaAsset = async (buffer: Buffer, originalFilename: string): Promise<MediaAsset> => {
  const processed = await processProductImage(buffer);

  return prisma.mediaAsset.create({
    data: {
      storageKey: processed.key,
      originalFilename: sanitizeOriginalFilename(originalFilename),
      storedFilename: processed.storedFilename,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.sizeBytes,
      variants: processed.variants as unknown as Prisma.InputJsonValue,
    },
  });
};

export const listMediaAssets = async (page: number, pageSize: number) => {
  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mediaAsset.count(),
  ]);

  return { items: items.map(serializeMedia), total, page, pageSize };
};

export const getMediaUsage = async () => {
  const aggregate = await prisma.mediaAsset.aggregate({ _count: { _all: true }, _sum: { sizeBytes: true } });
  return { count: aggregate._count._all, totalBytes: aggregate._sum.sizeBytes ?? 0 };
};

/**
 * Permanent deletion. Refuses while the asset is still attached to a product so
 * archived products keep their imagery; the physical files are only removed by
 * this explicit action.
 */
export const deleteMediaAsset = async (id: number) => {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: { _count: { select: { productImages: true } } },
  });
  if (!asset) throw ApiError.notFound('Media asset not found.');
  if (asset._count.productImages > 0) {
    throw ApiError.conflict('This image is still used by a product. Remove it from the product first.');
  }

  const keys = [asset.storageKey, ...readVariants(asset.variants).map((variant) => variant.key)];
  await prisma.mediaAsset.delete({ where: { id } });
  await Promise.all(keys.map((key) => storage.delete(key)));

  return { id, removedObjects: keys.length };
};
