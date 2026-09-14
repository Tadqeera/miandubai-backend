import sharp from 'sharp';
import { ApiError } from '../../lib/errors.js';
import { buildStorageKey, storage, withSuffix } from '../../storage/index.js';

export const DERIVATIVE_WIDTHS = [400, 800, 1200] as const;

/** Formats we are willing to decode. SVG is deliberately excluded. */
const SIGNATURES = {
  'image/jpeg': (buffer: Buffer) => buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer: Buffer) =>
    buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (buffer: Buffer) =>
    buffer.length > 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  'image/avif': (buffer: Buffer) =>
    buffer.length > 12 &&
    buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
    ['avif', 'avis'].includes(buffer.subarray(8, 12).toString('ascii')),
} satisfies Record<string, (buffer: Buffer) => boolean>;

export type AcceptedMime = keyof typeof SIGNATURES;

const EXTENSION_BY_MIME: Record<AcceptedMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/**
 * Detects the real format from the file's magic bytes. The browser-supplied
 * MIME type and the original filename extension are both ignored — they are
 * trivially forged and enable double-extension tricks.
 */
export const detectImageMime = (buffer: Buffer): AcceptedMime => {
  for (const [mime, matches] of Object.entries(SIGNATURES) as Array<[AcceptedMime, (b: Buffer) => boolean]>) {
    if (matches(buffer)) return mime;
  }
  throw ApiError.unsupportedMedia('Only JPEG, PNG, WebP and AVIF images are accepted.');
};

export interface ProcessedVariant {
  width: number;
  height: number;
  key: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ProcessedImage {
  key: string;
  storedFilename: string;
  mimeType: AcceptedMime;
  width: number;
  height: number;
  sizeBytes: number;
  variants: ProcessedVariant[];
}

/**
 * Stores the validated original plus WebP derivatives at 400/800/1200 px.
 * `fit: inside` never crops — perfume bottles keep their full silhouette and
 * the storefront normalises presentation with a 1:1 container instead.
 */
export const processProductImage = async (buffer: Buffer): Promise<ProcessedImage> => {
  const mimeType = detectImageMime(buffer);

  // limitInputPixels guards against decompression bombs.
  const pipeline = sharp(buffer, { limitInputPixels: 100_000_000, failOn: 'error' });
  const metadata = await pipeline.metadata();

  if (!metadata.width || !metadata.height) {
    throw ApiError.badRequest('Could not read the image dimensions.');
  }
  if (metadata.width < 200 || metadata.height < 200) {
    throw ApiError.badRequest('Images must be at least 200 × 200 pixels. 1200 × 1200 or larger is recommended.');
  }

  const extension = EXTENSION_BY_MIME[mimeType];
  const key = buildStorageKey('products', extension);

  // Re-encode through Sharp rather than trusting the uploaded bytes, and drop
  // metadata (EXIF/GPS) while honouring orientation.
  const normalized = await sharp(buffer, { limitInputPixels: 100_000_000 })
    .rotate()
    .toFormat(mimeType === 'image/jpeg' ? 'jpeg' : mimeType === 'image/png' ? 'png' : mimeType === 'image/avif' ? 'avif' : 'webp', {
      quality: 90,
    })
    .toBuffer({ resolveWithObject: true });

  await storage.save(key, normalized.data);

  const variants: ProcessedVariant[] = [];
  for (const width of DERIVATIVE_WIDTHS) {
    if (width > normalized.info.width && variants.length > 0) continue;
    const resized = await sharp(normalized.data, { limitInputPixels: 100_000_000 })
      .resize({ width: Math.min(width, normalized.info.width), withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    const variantKey = withSuffix(key, `-${width}`, 'webp');
    await storage.save(variantKey, resized.data);
    variants.push({
      width: resized.info.width,
      height: resized.info.height,
      key: variantKey,
      mimeType: 'image/webp',
      sizeBytes: resized.data.byteLength,
    });
  }

  return {
    key,
    storedFilename: key.split('/').pop() ?? key,
    mimeType,
    width: normalized.info.width,
    height: normalized.info.height,
    sizeBytes: normalized.data.byteLength,
    variants,
  };
};

export const sanitizeOriginalFilename = (filename: string): string => {
  const base = filename.split(/[\\/]/).pop() ?? 'upload';
  return base.replace(/[^\w. -]/g, '_').slice(0, 255) || 'upload';
};
