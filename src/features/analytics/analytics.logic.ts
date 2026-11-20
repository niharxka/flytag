/**
 * Turn a link's ?utm_source= into the tag we store: lowercase, spaces as _, only a–z 0–9 _ -,
 * at most 40 characters (the database enforces the same shape). "Instagram Story" → "instagram_story".
 * Anything that cleans down to nothing is no tag at all.
 */
export function normalizeSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const tag = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 40);
  return tag || null;
}

/** The utm_source in a URL query string ("?utm_source=discord&x=1" → "discord"), cleaned. */
export function sourceFromQuery(search: string): string | null {
  return normalizeSource(new URLSearchParams(search).get('utm_source'));
}
