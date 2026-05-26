import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { computeMasterScores, SCORE_DEFINITIONS } from "@/lib/auralis/master-scores"
import ScoreDetailView from "@/components/ScoreDetailView"

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

  let report: VisibilityReport | null = null
  try {
    const { data } = await supabase
      .from("visibility_reports")
      .select("raw_data")
      .eq("profile_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    report = (data?.raw_data ?? null) as VisibilityReport | null
  } catch {
    // fall through
  }

  if (!report) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-[#64748b]">
          Noch keine Analyse vorhanden.{" "}
          <a href="/dashboard/analyze" className="text-[#4F6EF7] hover:underline">
            Erste Analyse starten →
          </a>
        </p>
      </div>
    )
  }

  const masters = computeMasterScores(report)
  return (
    <ScoreDetailView
      score={masters.thoughtLeadership}
      definition={SCORE_DEFINITIONS["thought-leadership"]}
    />
  )
}
