/**
 * Sprachen der Webseite (digital-halo.de).
 *
 *   Deutsch     /              (Standard, ohne Präfix)
 *   Englisch    /en/…
 *   Französisch /fr/…
 *
 * Das Tool (app.digital-halo.de) bleibt vorerst Deutsch; Login und Registrierung
 * übernehmen die Sprache über ?lang=en|fr (siehe lib/i18n/auth.ts).
 * Reine Daten + Funktionen, ohne React – auch im Proxy nutzbar.
 */

export const LOCALES = ["de", "en", "fr"] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "de"

export const LOCALE_LABEL: Record<Locale, string> = { de: "Deutsch", en: "English", fr: "Français" }
export const LOCALE_SHORT: Record<Locale, string> = { de: "DE", en: "EN", fr: "FR" }
/** Für <html lang> und Open Graph. */
export const LOCALE_TAG: Record<Locale, string> = { de: "de", en: "en", fr: "fr" }
export const OG_LOCALE: Record<Locale, string> = { de: "de_DE", en: "en_GB", fr: "fr_FR" }

export function isLocale(x: string | null | undefined): x is Locale {
  return !!x && (LOCALES as readonly string[]).includes(x)
}

/** Seiten der Webseite mit ihrer Adresse je Sprache. */
export const SITE_ROUTES = {
  home: { de: "/", en: "/en", fr: "/fr" },
  waitlist: { de: "/warteliste", en: "/en/waitlist", fr: "/fr/liste-attente" },
  contact: { de: "/kontakt", en: "/en/contact", fr: "/fr/contact" },
  imprint: { de: "/legal/impressum", en: "/en/legal/imprint", fr: "/fr/legal/mentions-legales" },
  privacy: { de: "/legal/datenschutz", en: "/en/legal/privacy", fr: "/fr/legal/confidentialite" },
  terms: { de: "/legal/agb", en: "/en/legal/terms", fr: "/fr/legal/cgv" },
  demo: { de: "/demo", en: "/en/demo", fr: "/fr/demo" },
} as const satisfies Record<string, Record<Locale, string>>

export type SiteRoute = keyof typeof SITE_ROUTES

export function siteHref(route: SiteRoute, locale: Locale): string {
  return SITE_ROUTES[route][locale]
}

/** Sprache aus einem Pfad der Webseite (/en/… → en), sonst Deutsch. */
export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split("/")[1]
  return seg === "en" || seg === "fr" ? seg : DEFAULT_LOCALE
}

/** Welche Seite liegt hinter einem Pfad? Für den Sprachumschalter. */
export function routeOfPath(pathname: string): SiteRoute | null {
  const clean = pathname.replace(/\/+$/, "") || "/"
  for (const [route, paths] of Object.entries(SITE_ROUTES) as [SiteRoute, Record<Locale, string>][]) {
    if (Object.values(paths).includes(clean)) return route
  }
  return null
}

/** Link ins Tool (Registrierung, Login) mit Sprache für die Formulare. */
export function toolHref(path: "/registrieren" | "/login", locale: Locale, base = ""): string {
  return `${base}${path}${locale === DEFAULT_LOCALE ? "" : `?lang=${locale}`}`
}

/** hreflang-Angaben für Next-Metadaten (alternates). */
export function alternatesFor(route: SiteRoute, locale: Locale) {
  const paths = SITE_ROUTES[route]
  return {
    canonical: paths[locale],
    languages: { de: paths.de, en: paths.en, fr: paths.fr, "x-default": paths.de },
  }
}
