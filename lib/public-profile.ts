/**
 * Helpers für das Public Aura Score Profile (Sprint 15).
 */

/**
 * Wandelt einen Namen in einen URL-sicheren Slug um.
 * z.B. "Elon Musk" → "elon-musk", "Müller GmbH" → "muller-gmbh"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Umlaute
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    // Diakritika entfernen
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Alles außer a-z 0-9 → "-"
    .replace(/[^a-z0-9]+/g, "-")
    // Mehrfach-Bindestriche zusammenziehen
    .replace(/-+/g, "-")
    // Bindestriche am Anfang/Ende entfernen
    .replace(/^-+|-+$/g, "")
}

/** Minimallänge für Public-Slugs, damit z.B. `/u/x` nicht klappt. */
export const MIN_SLUG_LENGTH = 3
export const MAX_SLUG_LENGTH = 60

export function isValidSlug(slug: string): boolean {
  if (slug.length < MIN_SLUG_LENGTH || slug.length > MAX_SLUG_LENGTH) return false
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)
}
