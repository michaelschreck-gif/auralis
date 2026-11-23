import RegisterForm from "@/components/halo/RegisterForm"
import { isLocale } from "@/lib/i18n/site"

export const metadata = { title: "Registrieren · Halo" }
export const dynamic = "force-dynamic"

/**
 * Selbst-Registrierung für den kostenlosen Check (neue Konten im Tarif „free“).
 * Offen, solange nicht SIGNUP_OPEN=false gesetzt ist (Notbremse, z. B. bei Missbrauch).
 */
function signupOpen(): boolean {
  return process.env.SIGNUP_OPEN !== "false"
}

export default async function RegistrierenPage({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const { lang } = await searchParams
  const locale = typeof lang === "string" && isLocale(lang) ? lang : "de"
  return <RegisterForm open={signupOpen()} locale={locale} />
}
