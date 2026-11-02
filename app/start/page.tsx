import { redirect } from "next/navigation"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { homePath } from "@/lib/halo/home"
import { planOfOwner } from "@/lib/halo/plan-db"
import { planLimits } from "@/lib/halo/plans"
import { TOPIC_SUGGESTIONS } from "@/lib/halo/onboarding"
import { MARKET_LIST } from "@/lib/auralis/markets"
import StartWizard from "@/components/halo/StartWizard"

export const metadata = { title: "Loslegen · Halo" }
export const dynamic = "force-dynamic"
// Die Server-Action startet die ersten Messungen per after() – bis zu 300 s.
export const maxDuration = 300

export default async function StartPage() {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect("/login")

  // Bereits eingerichtet (Konto mit Person oder Mitglied) → dorthin.
  const home = await homePath(db, user.id)
  if (home !== "/start") redirect(home)

  // Neue Konten starten im kostenlosen Check (plan free).
  const limits = planLimits(await planOfOwner(db, user.id))

  return (
    <StartWizard
      markets={MARKET_LIST.map(m => ({ id: m.id, label: m.label, flag: m.flag, language: m.language }))}
      suggestions={TOPIC_SUGGESTIONS}
      maxTopics={limits.topicsPerPerson}
      teamAllowed={limits.teamAllowed}
    />
  )
}
