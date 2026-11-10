import { createHaloServerClient } from "@/lib/supabase/halo"
import type { Metadata } from "next"
import { Landing } from "@/components/landing/Landing"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "DigitalHalo — Wie KI dich sieht. Und wie du zur Antwort wirst.",
  description:
    "DigitalHalo misst, wie ChatGPT, Claude, Perplexity, Gemini und Google dich sehen – und verdichtet es zum Halo Score™. Mit Impulsen, Maßnahmen und Wochenbrief. Kostenloser Check.",
  openGraph: {
    title: "DigitalHalo — Die KI spricht über dich.",
    description: "Finde heraus, was ChatGPT, Claude, Perplexity, Gemini und Google über dich sagen. Kostenloser Check.",
    locale: "de_DE",
    type: "website",
  },
}

export default async function Home() {
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
  const toolHref = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${isLoggedIn ? "/weiter" : "/login"}`

  return <Landing toolHref={toolHref} isLoggedIn={isLoggedIn} />
}
