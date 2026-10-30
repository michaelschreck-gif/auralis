import RegisterForm from "@/components/halo/RegisterForm"

export const metadata = { title: "Registrieren · Halo" }
export const dynamic = "force-dynamic"

/**
 * Selbst-Registrierung ist in Production bewusst aus (Warteliste/Einladung),
 * bis SIGNUP_OPEN=true gesetzt wird. Auf Staging (Vercel Preview) und lokal offen.
 */
function signupOpen(): boolean {
  return (
    process.env.SIGNUP_OPEN === "true" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  )
}

export default function RegistrierenPage() {
  return <RegisterForm open={signupOpen()} />
}
