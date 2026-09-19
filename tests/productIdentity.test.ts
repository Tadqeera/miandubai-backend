import { describe, expect, it } from 'vitest';
import {
  namesAnotherProduct,
  resolveName,
  stripBrandSuffix,
  tidySpacing,
} from '../src/modules/products/identity.js';
import { isDistinctSelection } from '../src/modules/taxonomy/service.js';

/**
 * These strings are the ones the live catalogue actually held, not invented
 * examples. Zar Khadra's French and Spanish rows named Zar Ameer while keeping
 * Zar Khadra's slug, SKU, price and description, so the page, the heading and
 * the Product schema all introduced the wrong fragrance. Every name and every
 * image alt in those languages also carried a "| Mian Dubai" suffix pasted in
 * from the SEO title field.
 */
const CATALOGUE_SLUGS = ['zar-khadra-2', 'zar-ameer', 'zar-azraq'];

const ZAR_KHADRA = {
  slug: 'zar-khadra-2',
  englishName: 'Zar Khadra  Extrait de Parfum 80ml',
  brand: 'Mian Dubai',
};

const resolveFor = (field: string, raw: string | null | undefined, fallback = ZAR_KHADRA.englishName) =>
  resolveName(field, raw, {
    slug: ZAR_KHADRA.slug,
    brand: ZAR_KHADRA.brand,
    fallback,
    catalogueSlugs: CATALOGUE_SLUGS,
  });

describe('product name identity', () => {
  it('refuses a translation that names a different product', () => {
    const result = resolveFor('name', 'Zar Ameer Extrait de Parfum 80 ml | Mian Dubai');

    expect(result.value).toBe('Zar Khadra Extrait de Parfum 80ml');
    expect(result.value).not.toMatch(/Ameer/);
    expect(result.defects.map((defect) => defect.reason)).toContain('wrong-product');
  });

  it('names the product a wrong value was actually describing', () => {
    expect(namesAnotherProduct('Zar Ameer Extrait de Parfum 80 ml', ZAR_KHADRA.slug, CATALOGUE_SLUGS)).toBe('zar-ameer');
    expect(namesAnotherProduct('Zar Azraq', ZAR_KHADRA.slug, CATALOGUE_SLUGS)).toBe('zar-azraq');
  });

  it('keeps a genuine translation of the same product', () => {
    for (const legitimate of [
      'Zar Khadra Extrait de Parfum 80 ml',
      'Zar Khadra extrait de parfum 80ml',
      'Zar Khadra',
    ]) {
      expect(namesAnotherProduct(legitimate, ZAR_KHADRA.slug, CATALOGUE_SLUGS)).toBeNull();
    }
  });

  it('leaves free prose alone rather than guessing at it', () => {
    // An image alt, or a name in a language that shares no words with the
    // English one, names no other product and so is never second-guessed.
    for (const prose of [
      'A test bottle on dark stone',
      'Composition publiée',
      'Le flacon photographié de trois quarts',
      '',
    ]) {
      expect(namesAnotherProduct(prose, ZAR_KHADRA.slug, CATALOGUE_SLUGS)).toBeNull();
    }
  });

  it('has no opinion at all without a catalogue to compare against', () => {
    expect(namesAnotherProduct('Zar Ameer Extrait de Parfum', ZAR_KHADRA.slug, [])).toBeNull();
    expect(resolveName('name', 'Zar Ameer Extrait de Parfum', {
      slug: ZAR_KHADRA.slug,
      brand: ZAR_KHADRA.brand,
      fallback: ZAR_KHADRA.englishName,
    }).value).toBe('Zar Ameer Extrait de Parfum');
  });

  it('strips a brand suffix pasted in from the SEO title field', () => {
    const result = resolveFor('name', 'Zar Khadra Extrait de Parfum 80 ml | Mian Dubai');

    expect(result.value).toBe('Zar Khadra Extrait de Parfum 80 ml');
    expect(result.defects.map((defect) => defect.reason)).toContain('brand-suffix');
  });

  it('strips the suffix whatever separator was typed', () => {
    for (const separator of ['|', '·', '–', '—', '-']) {
      expect(stripBrandSuffix(`Zar Azraq Extrait de Parfum ${separator} Mian Dubai`, 'Mian Dubai')).toBe(
        'Zar Azraq Extrait de Parfum',
      );
    }
  });

  it('leaves a name that is only the brand alone rather than emptying it', () => {
    expect(stripBrandSuffix('Mian Dubai', 'Mian Dubai')).toBe('Mian Dubai');
  });

  it('tidies the double spacing the catalogue rows carry', () => {
    expect(tidySpacing('Zar Khadra  Extrait de Parfum 80ml')).toBe('Zar Khadra Extrait de Parfum 80ml');
    expect(resolveFor('name', 'Zar Khadra  Extrait de Parfum 80 ml').value).toBe('Zar Khadra Extrait de Parfum 80 ml');
  });

  it('falls back to the English name, tidied, when a translation is missing', () => {
    for (const empty of [null, undefined, '', '   ']) {
      expect(resolveFor('name', empty).value).toBe('Zar Khadra Extrait de Parfum 80ml');
    }
  });

  it('corrects an image alt that describes the wrong product', () => {
    const result = resolveFor('images[0].alt', 'Zar Ameer Extrait de Parfum 80 ml | Mian Dubai', 'Mian Dubai Zar Khadra');

    expect(result.value).toBe('Mian Dubai Zar Khadra');
    expect(result.defects.map((defect) => defect.reason)).toContain('wrong-product');
  });

  it('ignores the trailing uniqueness suffix a slug carries', () => {
    // `zar-khadra-2` is `zar-khadra` plus a disambiguating number; the "2" is
    // not part of the name and must not be demanded of a translation.
    expect(namesAnotherProduct('Zar Khadra Extrait de Parfum', 'zar-khadra-2', CATALOGUE_SLUGS)).toBeNull();
  });

  it('ignores concentration and size, which identify nothing', () => {
    // Two products sharing "Extrait de Parfum 80 ml" must not look like each
    // other; only the words that name the fragrance count.
    expect(namesAnotherProduct('Extrait de Parfum 80 ml', 'zar-khadra-2', CATALOGUE_SLUGS)).toBeNull();
    expect(namesAnotherProduct('Eau de Parfum 50ml', 'zar-khadra-2', CATALOGUE_SLUGS)).toBeNull();
  });

  it('needs every word of another product’s name before it accuses one', () => {
    // "Zar" alone is shared by all three fragrances and accuses nobody.
    expect(namesAnotherProduct('Zar', 'zar-khadra-2', CATALOGUE_SLUGS)).toBeNull();
    expect(namesAnotherProduct('Zar Extrait de Parfum', 'zar-khadra-2', CATALOGUE_SLUGS)).toBeNull();
  });

  it('holds every Mian Dubai product name steady, and lets none stand in for another', () => {
    const catalogue = [
      { slug: 'zar-khadra-2', english: 'Zar Khadra  Extrait de Parfum 80ml' },
      { slug: 'zar-ameer', english: 'Zar Ameer Extrait de Parfum 80ml' },
      { slug: 'zar-azraq', english: 'Zar Azraq  Extrait de Parfum 80ml' },
    ];

    for (const product of catalogue) {
      const translated = tidySpacing(product.english).replace('80ml', '80 ml');
      expect(namesAnotherProduct(translated, product.slug, CATALOGUE_SLUGS)).toBeNull();

      // …and every other product in the catalogue is caught standing in for it.
      for (const other of catalogue.filter((entry) => entry.slug !== product.slug)) {
        expect(
          namesAnotherProduct(other.english, product.slug, CATALOGUE_SLUGS),
          `"${other.english}" was allowed to pass as ${product.slug}`,
        ).toBe(other.slug);
      }
    }
  });
});

describe('collection indexability', () => {
  it('does not index a collection that holds the whole catalogue', () => {
    // The live state: three collections, three products, one catalogue.
    expect(isDistinctSelection(3, 3)).toBe(false);
  });

  it('indexes a collection that holds a genuine subset', () => {
    expect(isDistinctSelection(2, 3)).toBe(true);
    expect(isDistinctSelection(1, 12)).toBe(true);
  });

  it('does not index an empty collection', () => {
    expect(isDistinctSelection(0, 3)).toBe(false);
  });
});
