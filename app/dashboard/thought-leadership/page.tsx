import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { computeMasterScores, computeScoreDerivation, SCORE_DEFINITIONS } from "@/lib/auralis/master-scores"
import ScoreDetailView from "@/components/ScoreDetailView"
import DashboardShell from "@/components/DashboardShell"

export const dynamic = "force-dynamic"

export default async function ThoughtLeadershipPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let report: VisibilityReport | null = null
  try {
    const [profileResult, reportResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("visibility_reports")
        .select("raw_data")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    userName = profileResult.data?.full_name ?? ""
    report = (reportResult.data?.raw_data ?? null) as VisibilityReport | null
  } catch {
    // fall through
  }

  if (!report) {
    return (
      <DashboardShell userName={userName}>
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          <p className="text-sm text-[#64748b]">
            Noch keine Analyse vorhanden.{" "}
            <a href="/dashboard/analyze" className="text-[#7F77DD] hover:underline">
              Erste Analyse starten →
            </a>
          </p>
        </div>
      </DashboardShell>
    )
  }

  const masters = computeMasterScores(report)
  return (
    <DashboardShell userName={userName}>
      <ScoreDetailView
        score={masters.thoughtLeadership}
        definition={SCORE_DEFINITIONS["thought-leadership"]}
        derivation={computeScoreDerivation("thought-leadership", report)}
      />
    </DashboardShell>
  )
}
