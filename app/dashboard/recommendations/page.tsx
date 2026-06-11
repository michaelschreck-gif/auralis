import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import RecommendationsPanel, { type RecRow } from "@/components/RecommendationsPanel"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

export const dynamic = "force-dynamic"

export default async function RecommendationsPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let plan = "free"
  let openRecs: RecRow[] = []
  let doneRecs: RecRow[] = []
  let currentScore: number | null = null
  let hasReport = false

  try {
    const [profileResult, reportResult, recsResult] = await Promise.all([
      supabase.from("profiles").select("full_name, plan").eq("id", user!.id).single(),
      supabase
        .from("visibility_reports")
        .select("raw_data, visibility_score")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("recommendations")
        .select("id, title, description, impact, category, status, score_at_creation, score_at_done, created_at, done_at")
        .eq("profile_id", user!.id)
        .in("status", ["open", "done"])
        .order("created_at", { ascending: false }),
    ])

    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"

    if (reportResult.data) {
      hasReport = true
      const raw = reportResult.data.raw_data as VisibilityReport | null
      currentScore =
        raw?.overallScore ??
        (reportResult.data.visibility_score !== null
          ? Math.round(Number(reportResult.data.visibility_score))
          : null)
    }

    const all = (recsResult.data ?? []) as RecRow[]
    openRecs = all.filter(r => r.status === "open")
    doneRecs = all.filter(r => r.status === "done")
  } catch {
    // continue with empty defaults
  }

  return (
    <DashboardShell userName={userName} plan={plan}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#0f172a]">Empfehlungen</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Personalisierte Maßnahmen zur Verbesserung deiner KI-Sichtbarkeit — generiert von Claude. Hake erledigte Maßnahmen ab und verfolge ihre Wirkung auf deinen Score.
          </p>
        </header>

        <RecommendationsPanel
          open={openRecs}
          done={doneRecs}
          currentScore={currentScore}
          hasReport={hasReport}
        />
      </div>
    </DashboardShell>
  )
}
