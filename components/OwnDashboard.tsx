import { smoothReports, SMOOTHING_WINDOW_DAYS, SMOOTHING_MAX_RUNS, type SmoothingInfo } from "@/lib/auralis/smoothing"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Cockpit from "@/components/Cockpit"
import DashboardShell from "@/components/DashboardShell"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { computeSeoScore, type SeoReportData, type SeoScore } from "@/lib/auralis/seo-score"

function smoothingWindowStart(): string {
  return new Date(Date.now() - SMOOTHING_WINDOW_DAYS * 86_400_000).toISOString()
}

export default async function OwnDashboard() {
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
  let report: VisibilityReport | null = null
  let latestReportId: string | null = null
  let seoScore: SeoScore | null = null
  let smoothing: SmoothingInfo | null = null

  try {
    const [profileResult, reportResult, seoResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, plan")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("visibility_reports")
        .select("id, raw_data, schedule_id, created_at")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("seo_reports")
        .select("raw_data")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"
    report = (reportResult.data?.raw_data ?? null) as VisibilityReport | null
    latestReportId = reportResult.data?.id ?? null

    // Zeitliche Glättung: Läufe desselben Themas der letzten 28 Tage mitteln.
    if (reportResult.data?.schedule_id) {
      const since = smoothingWindowStart()
      const { data: recent } = await supabase
        .from("visibility_reports")
        .select("raw_data")
        .eq("profile_id", user!.id)
        .eq("schedule_id", reportResult.data.schedule_id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(SMOOTHING_MAX_RUNS)
      const runs = (recent ?? []).map(r => r.raw_data as unknown as VisibilityReport).filter(Boolean)
      if (runs.length >= 2) {
        const smoothed = smoothReports(runs)
        report = { ...(report as VisibilityReport), ...smoothed.report }
        smoothing = smoothed.info
      }
    }
    seoScore = computeSeoScore((seoResult.data?.raw_data ?? null) as SeoReportData | null)
  } catch {
    // continue with empty defaults
  }

  return (
    <DashboardShell userName={userName} plan={plan}>
      <Cockpit userName={userName} report={report} latestReportId={latestReportId} seoScore={seoScore} smoothing={smoothing} />
    </DashboardShell>
  )
}
