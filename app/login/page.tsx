import LoginForm from "@/components/halo/LoginForm"
import { isLocale } from "@/lib/i18n/site"

export const metadata = { title: "Login · Halo" }

/** Sprache der Anmeldeseite über ?lang=en|fr (Links von /en und /fr), sonst Deutsch. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const { lang } = await searchParams
  const l = typeof lang === "string" && isLocale(lang) ? lang : "de"
  return <LoginForm locale={l} />
}
