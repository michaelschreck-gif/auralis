import { redirect } from "next/navigation"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { planOfAccount } from "@/lib/halo/plan-db"
import { planLimits } from "@/lib/halo/plans"
import { TOPIC_SUGGESTIONS } from "@/lib/halo/onboarding"
import { ownedTeamAccount } from "@/lib/halo/people"
import { MARKET_LIST } from "@/lib/auralis/markets"
import StartWizard from "@/components/halo/StartWizard"

export const metadata = { title: "Person hinzufügen · Halo" }
export const dynamic = "force-dynamic"
// Die Server-Action startet die ersten Messungen per after() – bis zu 300 s.
export const maxDuration = 300

export default async function NeuePersonPage() {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect("/login")
  const team = await ownedTeamAccount(db, user.id)
  if (!team) redirect("/weiter")
  const limits = planLimits(await planOfAccount(db, team.id))
  if (!limits.teamAllowed) redirect("/personen")

  return (
    <StartWizard
      mode="addPerson"
      markets={MARKET_LIST.map(m => ({ id: m.id, label: m.label, flag: m.flag, language: m.language }))}
      suggestions={TOPIC_SUGGESTIONS}
      maxTopics={limits.topicsPerPerson}
    />
  )
}
