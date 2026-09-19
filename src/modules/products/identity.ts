/**
 * Guards against a translated product taking on another product's identity.
 *
 * Product copy is written per language in the administration, and a French or
 * Spanish row is filled in by hand. Two things have gone wrong in practice:
 *
 *   1. the SEO title was pasted into the name field, so the heading, the
 *      breadcrumb and the Product schema all read "… | Mian Dubai"; and
 *   2. one product's name was pasted into another product's translation, so
 *      Zar Khadra introduced itself as Zar Ameer in French and Spanish while
 *      its price, slug, SKU and description stayed its own.
 *
 * The second is the serious one: a page that names the wrong product is wrong
 * for the reader, and structured data that disagrees with the page is worse
 * than none. Both are corrected here, on the way out of the database, so every
 * consumer — the storefront, the sitemap, the API — sees the same thing, and a
 * future mistake of either kind cannot reach a visitor.
 *
 * This is a safety net, not a substitute for fixing the row. `nameDefects`
 * reports what it had to correct so the administration can be put right.
 */

/** Words that carry no identity: sizes, concentrations and grammatical filler. */
const GENERIC = new Set([
  'de',
  'del',
  'la',
  'le',
  'les',
  'el',
  'du',
  'ml',
  'the',
  'and',
  'et',
  'y',
  'parfum',
  'perfume',
  'extrait',
  'eau',
  'toilette',
  'cologne',
  'edp',
  'edt',
]);

const tokens = (value: string): string[] =>
  value
    .toLowerCase()
    // Separators, punctuation and the boundary between a number and a unit.
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/(\d)(\p{L})/gu, '$1 $2')
    .split(' ')
    .filter(Boolean);

/**
 * The words in a slug that say which product this is.
 *
 * A trailing number is a uniqueness suffix the system added (`zar-khadra-2`),
 * not part of the name, so it is dropped. Generic fragrance vocabulary is
 * dropped too: only `zar` and `khadra` are left to identify the product.
 */
const slugIdentity = (slug: string): string[] => {
  const parts = tokens(slug);
  while (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1]!)) parts.pop();
  return parts.filter((part) => !GENERIC.has(part) && !/^\d+$/.test(part));
};

/** Collapses runs of whitespace, which hand-edited rows frequently carry. */
export const tidySpacing = (value: string): string => value.replace(/\s+/g, ' ').trim();

/**
 * Removes a brand suffix a name should never have carried:
 * `Zar Ameer Extrait de Parfum 80 ml | Mian Dubai` → `Zar Ameer Extrait de Parfum 80 ml`.
 *
 * Only a trailing separator followed by the brand is removed, so a product
 * genuinely called after the house keeps its name.
 */
export const stripBrandSuffix = (value: string, brand: string): string => {
  const trimmed = tidySpacing(value);
  if (!brand.trim()) return trimmed;

  const escaped = brand.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suffix = new RegExp(`\\s*[|\\u00b7\\u2013\\u2014-]\\s*${escaped}\\s*$`, 'i');
  const stripped = trimmed.replace(suffix, '').trim();
  return stripped === '' ? trimmed : stripped;
};

/**
 * Which other product in the catalogue this text is describing, if any.
 *
 * Asking "has this stopped naming its own product?" cannot tell a wrong name
 * from a well translated one: `Composition publiée` drops every English word of
 * `Published Composition` in exactly the way `Zar Ameer` drops `Khadra`. The
 * difference is that one of them positively names something else, so that is
 * what is tested — the catalogue's own slugs are the vocabulary of real product
 * names, and a value is only rejected when it spells one of them out.
 *
 * The consequence is a guard with no opinion it cannot justify: it either names
 * the product it thinks was meant, or it leaves the text alone.
 */
export const namesAnotherProduct = (
  candidate: string,
  slug: string,
  catalogueSlugs: readonly string[],
): string | null => {
  const candidateWords = new Set(tokens(candidate));
  const ownIdentity = slugIdentity(slug);
  const matches = (identity: readonly string[]) =>
    identity.length > 0 && identity.every((word) => candidateWords.has(word));

  // A value that still spells out its own product is its own, whatever else it
  // happens to contain.
  if (matches(ownIdentity)) return null;

  for (const other of catalogueSlugs) {
    if (other === slug) continue;
    if (matches(slugIdentity(other))) return other;
  }
  return null;
};

export interface NameDefect {
  field: string;
  reason: 'brand-suffix' | 'wrong-product' | 'spacing';
  value: string;
}

export interface ResolvedName {
  value: string;
  defects: NameDefect[];
}

/**
 * The name to show for one field, with both faults corrected.
 *
 * A value that has drifted onto another product is discarded entirely in favour
 * of `fallback` — the English name — because a half-right name is not better
 * than the right one in the wrong language.
 */
export const resolveName = (
  field: string,
  raw: string | null | undefined,
  {
    slug,
    brand,
    fallback,
    catalogueSlugs = [],
  }: { slug: string; brand: string; fallback: string; catalogueSlugs?: readonly string[] },
): ResolvedName => {
  const defects: NameDefect[] = [];
  const source = raw ?? '';
  // The fallback is tidied too: it is usually the English row, which carries
  // the same hand-entered double spacing as every other row.
  const safeFallback = tidySpacing(fallback);
  if (tidySpacing(source) === '') return { value: safeFallback, defects };

  if (/\s{2,}/.test(source)) defects.push({ field, reason: 'spacing', value: source });

  const withoutBrand = stripBrandSuffix(source, brand);
  if (withoutBrand !== tidySpacing(source)) defects.push({ field, reason: 'brand-suffix', value: source });

  // Only a value that names a different product in this catalogue is discarded.
  // Without the catalogue to compare against — a caller that does not have it
  // to hand — the text is cleaned but never second-guessed.
  const intruder = namesAnotherProduct(withoutBrand, slug, catalogueSlugs);
  if (intruder) {
    defects.push({ field, reason: 'wrong-product', value: source });
    return { value: safeFallback, defects };
  }

  return { value: withoutBrand, defects };
};
