const COMBINING_MARKS = /[̀-ͯ]/g;

export const slugify = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);

/** Appends -2, -3, ... until the slug is free. */
export const uniqueSlug = async (
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> => {
  const root = slugify(base) || 'item';
  let candidate = root;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
    if (suffix > 500) throw new Error(`Unable to derive a unique slug for "${base}".`);
  }
  return candidate;
};
