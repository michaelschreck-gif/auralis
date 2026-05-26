import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import CompetitorsPanel, {
  type CompetitorRow,
  type SelfRow,
} from "@/components/CompetitorsPanel"
import { canAnalyzeCompetitors, type PlanType } from "@/lib/auralis/runner"

export const dynamic = "force-dynamic"

export default async function CompetitorsPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let selfScore: number | null = null
  let plan: PlanType = "free"
  let competitors: CompetitorRow[] = []

  try {
    const [profileResult, competitorsResult, latestReportResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, plan")
          .eq("id", user!.id)
          .single(),
        supabase
          .from("competitors")
          .select("id, name, topics, last_score, last_analyzed_at")
          .eq("profile_id", user!.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("visibility_reports")
          .select("visibility_score")
          .eq("profile_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

    userName = profileResult.data?.full_name ?? ""
    plan = (profileResult.data?.plan ?? "free") as PlanType
    competitors = (competitorsResult.data ?? []) as CompetitorRow[]
    const rawScore = latestReportResult.data?.visibility_score
    selfScore = rawScore !== null && rawScore !== undefined
      ? Math.round(Number(rawScore))
      : null
  } catch {
    // continue with empty defaults
  }

  const self: SelfRow = { name: userName, score: selfScore }
  const canAnalyze = canAnalyzeCompetitors(plan)

  return (
    <DashboardShell userName={userName}>
      <CompetitorsPanel
        self={self}
        competitors={competitors}
        canAnalyze={canAnalyze}
        plan={plan}
      />
    </DashboardShell>
  )
}
