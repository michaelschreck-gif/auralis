import type { Metadata } from "next"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { alternatesFor, OG_LOCALE, toolHref as toolLink, type Locale } from "@/lib/i18n/site"
import { Landing } from "./Landing"
import { de } from "./dict/de"
import { en } from "./dict/en"
import { fr } from "./dict/fr"

const DICTS = { de, en, fr }

export function landingMetadata(locale: Locale): Metadata {
  const m = DICTS[locale].meta
  return {
    title: m.title,
    description: m.description,
    alternates: alternatesFor("home", locale),
    openGraph: { title: m.ogTitle, description: m.ogDescription, locale: OG_LOCALE[locale], type: "website" },
  }
}

/** Startseite in einer Sprache (Server): prüft nur, ob jemand angemeldet ist. */
export async function LandingPage({ locale }: { locale: Locale }) {
  let isLoggedIn = false
  try {
    const supabase = await createHaloServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // build time
  }
  // Eigenständige Webseite: angemeldete Besucher bleiben hier und bekommen nur einen Link ins Tool.
  // Absolute URL, weil das Tool auf app.digital-halo.de läuft (lib/domains.ts); ohne Env relativ.
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const toolHref = isLoggedIn ? `${base}/weiter` : toolLink("/login", locale, base)
  return <Landing locale={locale} toolHref={toolHref} isLoggedIn={isLoggedIn} />
}
