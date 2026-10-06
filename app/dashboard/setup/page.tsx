import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import SetupAssistant from "@/components/SetupAssistant"
import { isMarketId, maxMarketsForPlan, type MarketId } from "@/lib/auralis/markets"
import type { Database } from "@/lib/supabase/database.types"

export const dynamic = "force-dynamic"

type PlanType = Database["public"]["Enums"]["plan_type"]

export default async function SetupPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan, language")
    .eq("id", user.id)
    .single()
  const plan = (profile?.plan ?? "free") as PlanType

  // Neue Spalten tolerant laden (Migration evtl. noch nicht ausgeführt).
  let subjectName = ""
  let markets: MarketId[] = []
  try {
    const { data, error } = await (supabase as unknown as SupabaseClient)
      .from("profiles")
      .select("subject_name, target_markets")
      .eq("id", user.id)
      .single()
    if (!error && data) {
      const d = data as { subject_name?: string | null; target_markets?: string[] | null }
      subjectName = d.subject_name?.trim() ?? ""
      markets = (d.target_markets ?? []).filter(isMarketId)
    }
  } catch {
    // Standardwerte
  }

  const { data: schedules } = await supabase
    .from("monitoring_schedules")
    .select("query, is_active, created_at")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
  const topics = (schedules ?? []).map(s => s.query)

  const language = (profile?.language ?? "de") as "de" | "en"
  const isFirstRun = topics.length === 0

  return (
    <DashboardShell userName={profile?.full_name ?? ""} plan={plan}>
      <SetupAssistant
        isFirstRun={isFirstRun}
        plan={plan}
        maxMarkets={maxMarketsForPlan(plan)}
        initialName={subjectName || profile?.full_name || ""}
        initialMarkets={markets.length > 0 ? markets : [language === "de" ? "dach" : "global"]}
        initialTopics={topics}
        language={language}
      />
    </DashboardShell>
  )
}
