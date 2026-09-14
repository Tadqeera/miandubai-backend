/**
 * Derives the browser-tab and touch icons from the supplied Mian Dubai logo.
 *
 *   npm run brand:assets
 *
 * It only ever RESIZES the artwork that already exists in
 * `frontend/src/assets/` — no mark is drawn, generated or substituted here, and
 * the source files are never written to. Re-run it if the logo is ever
 * replaced.
 *
 * Sharp lives in the backend's dependencies, which is why this script does.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

const SOURCE = path.join(repoRoot, 'frontend', 'src', 'assets', 'miandubaifavicon.png');
const NAVBAR_LOGO = path.join(repoRoot, 'frontend', 'src', 'assets', 'miandubailogonavbar.png');

/** The brand black, so an opaque icon matches the site rather than going grey. */
const BACKDROP = { r: 7, g: 7, b: 7, alpha: 1 };

const ensureDir = async (dir: string) => fs.mkdir(dir, { recursive: true });

/** Transparent PNG, for browser tabs — the tab strip supplies its own colour. */
const transparentIcon = async (size: number, destination: string) => {
  await sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(destination);
};

/**
 * Opaque PNG with a small inset, for home-screen icons: iOS flattens
 * transparency to black and crops to a rounded square, so the mark needs room.
 */
const touchIcon = async (size: number, destination: string) => {
  const inset = Math.round(size * 0.14);
  const mark = await sharp(SOURCE)
    .resize(size - inset * 2, size - inset * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({ create: { width: size, height: size, channels: 4, background: BACKDROP } })
    .composite([{ input: mark, top: inset, left: inset }])
    .png({ compressionLevel: 9 })
    .toFile(destination);
};

const run = async () => {
  const targets = [
    path.join(repoRoot, 'frontend', 'public'),
    path.join(repoRoot, 'admin', 'public'),
  ];

  for (const dir of targets) {
    await ensureDir(dir);
    await transparentIcon(32, path.join(dir, 'favicon-32.png'));
    await transparentIcon(64, path.join(dir, 'favicon.png'));
    await transparentIcon(192, path.join(dir, 'icon-192.png'));
    await touchIcon(180, path.join(dir, 'apple-touch-icon.png'));
    console.log(`  icons  → ${path.relative(repoRoot, dir)}`);
  }

  // The administration application shows the same real logo as the storefront.
  const adminAssets = path.join(repoRoot, 'admin', 'src', 'assets');
  await ensureDir(adminAssets);
  await fs.copyFile(NAVBAR_LOGO, path.join(adminAssets, 'miandubailogonavbar.png'));
  await fs.copyFile(SOURCE, path.join(adminAssets, 'miandubaimark.png'));
  console.log('  logo   → admin/src/assets');
};

run().catch((error: unknown) => {
  console.error('Failed to build the brand assets.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
