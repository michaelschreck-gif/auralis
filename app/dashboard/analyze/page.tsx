import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import AnalyzePanel, {
  type ScheduleRow,
  type ScoreHistoryPoint,
} from "@/components/AnalyzePanel"
import {
  checkManualAnalysisLimit,
  type PlanType,
} from "@/lib/auralis/runner"

export const dynamic = "force-dynamic"

export default async function AnalyzePage() {
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
  let plan: PlanType = "free"
  let schedules: ScheduleRow[] = []
  let history: ScoreHistoryPoint[] = []

  try {
    const [profileResult, schedulesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, plan")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("monitoring_schedules")
        .select("id, name, query, language, frequency, last_run_at, next_run_at")
        .eq("profile_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ])

    userName = profileResult.data?.full_name ?? ""
    plan = (profileResult.data?.plan ?? "free") as PlanType
    schedules = (schedulesResult.data ?? []) as ScheduleRow[]

    // Score history for the last 30 days across all active schedules
    const scheduleIds = schedules.map(s => s.id)
    if (scheduleIds.length > 0) {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data: reports } = await supabase
        .from("visibility_reports")
        .select("schedule_id, visibility_score, created_at")
        .in("schedule_id", scheduleIds)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true })

      history = (reports ?? [])
        .filter(r => r.visibility_score !== null && r.schedule_id !== null)
        .map(r => ({
          date: r.created_at,
          score: Math.round(Number(r.visibility_score)),
          scheduleId: r.schedule_id!,
        }))
    }
  } catch {
    // continue with empty defaults
  }

  // Compute remaining-quota for the banner
  const limit = await checkManualAnalysisLimit(user!.id, plan, supabase)
  const remaining = limit.allowed ? limit.remaining : 0
  const resetAt = limit.allowed ? null : limit.resetAt

  return (
    <DashboardShell userName={userName}>
      <AnalyzePanel
        schedules={schedules}
        history={history}
        remaining={remaining}
        resetAt={resetAt}
        plan={plan}
      />
    </DashboardShell>
  )
}
