import RegisterForm from "@/components/halo/RegisterForm"

export const metadata = { title: "Registrieren · Halo" }
export const dynamic = "force-dynamic"

/**
 * Selbst-Registrierung für den kostenlosen Check (neue Konten im Tarif „free“).
 * Offen, solange nicht SIGNUP_OPEN=false gesetzt ist (Notbremse, z. B. bei Missbrauch).
 */
function signupOpen(): boolean {
  return process.env.SIGNUP_OPEN !== "false"
}

export default function RegistrierenPage() {
  return <RegisterForm open={signupOpen()} />
}
