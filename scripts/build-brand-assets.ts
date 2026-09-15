/**
 * Derives the browser-tab and touch icons, the web-sized logos and the
 * responsive artwork from the supplied Mian Dubai files.
 *
 *   npm run brand:assets
 *
 * It only ever RESIZES and RE-ENCODES the artwork that already exists in
 * `frontend/src/assets/`. No mark is drawn, generated or substituted here, and
 * the source files are never written to. Re-run it if the logo or a photograph
 * is ever replaced.
 *
 * Sharp lives in the backend's dependencies, which is why this script does.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

const FRONTEND_ASSETS = path.join(repoRoot, 'frontend', 'src', 'assets');
const OPTIMIZED = path.join(FRONTEND_ASSETS, 'optimized');

const SOURCE = path.join(FRONTEND_ASSETS, 'miandubaifavicon.png');
const NAVBAR_LOGO = path.join(FRONTEND_ASSETS, 'miandubailogonavbar.png');
const FOOTER_LOGO = path.join(FRONTEND_ASSETS, 'miandubailogofooter.png');

/** Site photography, served as WebP at these widths (never wider than the original). */
const ARTWORK = [
  'heromiandubai',
  'collectionpageheroimage',
  'collectionpagebgimagelight',
  'collectionmiandubai',
  'scentmiandubai',
  'aboutheroimagemiandubai',
  'contactuspagemiandubaiheroimage',
  'legalpagemiandubaiheroimage',
  'footermaindubai',
  'miandubaiblog1',
  'miandubaiblog2',
  'miandubaiblog3',
];
const ARTWORK_WIDTHS = [640, 1280, 1920];

/** The brand black, so an opaque icon matches the site rather than going grey. */
const BACKDROP = { r: 7, g: 7, b: 7, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const ensureDir = async (dir: string) => fs.mkdir(dir, { recursive: true });

/** Transparent PNG, for browser tabs, where the tab strip supplies its own colour. */
const transparentIcon = (size: number) =>
  sharp(SOURCE).resize(size, size, { fit: 'contain', background: TRANSPARENT }).png({ compressionLevel: 9 }).toBuffer();

/**
 * Opaque PNG with a small inset, for home-screen icons: iOS flattens
 * transparency to black and crops to a rounded square, so the mark needs room.
 */
const touchIcon = async (size: number) => {
  const inset = Math.round(size * 0.14);
  const mark = await sharp(SOURCE)
    .resize(size - inset * 2, size - inset * 2, { fit: 'contain', background: TRANSPARENT })
    .toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: BACKDROP } })
    .composite([{ input: mark, top: inset, left: inset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
};

/**
 * A `.ico` container holding PNG images, which every current browser reads.
 * Browsers still request /favicon.ico on their own, so it must exist.
 */
const icoFromPngs = (images: Array<{ size: number; data: Buffer }>) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;
  images.forEach((image, index) => {
    const at = index * 16;
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, at);
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, at + 1);
    directory.writeUInt8(0, at + 2);
    directory.writeUInt8(0, at + 3);
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(image.data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += image.data.length;
  });

  return Buffer.concat([header, directory, ...images.map((image) => image.data)]);
};

/**
 * A logo at a fixed pixel width. A palette PNG: for flat gold artwork with
 * transparency it comes out smaller than WebP, and every browser reads it.
 */
const webLogo = async (source: string, width: number, name: string) => {
  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 95 })
    .toFile(path.join(OPTIMIZED, `${name}.png`));
};

const run = async () => {
  const [ico16, ico32, ico48, favicon32, favicon64, icon192, touch180, touch512] = await Promise.all([
    transparentIcon(16),
    transparentIcon(32),
    transparentIcon(48),
    transparentIcon(32),
    transparentIcon(64),
    transparentIcon(192),
    touchIcon(180),
    touchIcon(512),
  ]);
  const ico = icoFromPngs([
    { size: 16, data: ico16 },
    { size: 32, data: ico32 },
    { size: 48, data: ico48 },
  ]);

  for (const dir of [path.join(repoRoot, 'frontend', 'public'), path.join(repoRoot, 'admin', 'public')]) {
    await ensureDir(dir);
    await fs.writeFile(path.join(dir, 'favicon.ico'), ico);
    await fs.writeFile(path.join(dir, 'favicon-32.png'), favicon32);
    await fs.writeFile(path.join(dir, 'favicon.png'), favicon64);
    await fs.writeFile(path.join(dir, 'icon-192.png'), icon192);
    await fs.writeFile(path.join(dir, 'apple-touch-icon.png'), touch180);
    await fs.writeFile(path.join(dir, 'icon-512.png'), touch512);
    console.log(`  icons    → ${path.relative(repoRoot, dir)}`);
  }

  // The source logos are 2172 px and 1254 px wide; the header shows the first
  // at about 156 px and the footer the second at 96 px. Twice the display size
  // stays sharp on high-density screens.
  await ensureDir(OPTIMIZED);
  await webLogo(NAVBAR_LOGO, 360, 'logo-navbar-360');
  await webLogo(FOOTER_LOGO, 240, 'logo-footer-240');
  console.log('  logos    → frontend/src/assets/optimized');

  // The link-preview image for pages without their own: the hero photograph at
  // the 1200 × 630 size social platforms expect, cropped from its lit right side.
  await sharp(path.join(FRONTEND_ASSETS, 'heromiandubai.jpg'))
    .resize(1200, 630, { fit: 'cover', position: 'right' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(repoRoot, 'frontend', 'public', 'og-image.jpg'));
  console.log('  og image → frontend/public/og-image.jpg');

  for (const name of ARTWORK) {
    const source = path.join(FRONTEND_ASSETS, `${name}.jpg`);
    const { width = 0 } = await sharp(source).metadata();
    const widths = [...new Set(ARTWORK_WIDTHS.map((target) => Math.min(target, width)))];
    for (const target of widths) {
      await sharp(source)
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality: 74, effort: 5 })
        .toFile(path.join(OPTIMIZED, `${name}-${target}.webp`));
    }
    console.log(`  artwork  → ${name} (${widths.join(', ')})`);
  }

  // The administration application shows the same real logo as the storefront.
  const adminAssets = path.join(repoRoot, 'admin', 'src', 'assets');
  await ensureDir(adminAssets);
  await fs.copyFile(NAVBAR_LOGO, path.join(adminAssets, 'miandubailogonavbar.png'));
  await fs.copyFile(SOURCE, path.join(adminAssets, 'miandubaimark.png'));
  console.log('  logo     → admin/src/assets');
};

run().catch((error: unknown) => {
  console.error('Failed to build the brand assets.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
