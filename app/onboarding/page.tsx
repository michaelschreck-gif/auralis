import { redirect } from "next/navigation"

// Das frühere Onboarding ist im Setup-Assistenten aufgegangen
// (Person · Region · Themen → /dashboard/setup). Alte Links bleiben gültig.
export default function OnboardingPage() {
  redirect("/dashboard/setup")
}
