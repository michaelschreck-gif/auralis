import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Cockpit from "@/components/Cockpit"
import DashboardShell from "@/components/DashboardShell"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { computeSeoScore, type SeoReportData, type SeoScore } from "@/lib/auralis/seo-score"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
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

  try {
    const [profileResult, reportResult, seoResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, plan")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("visibility_reports")
        .select("id, raw_data")
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
    seoScore = computeSeoScore((seoResult.data?.raw_data ?? null) as SeoReportData | null)
  } catch {
    // continue with empty defaults
  }

  return (
    <DashboardShell userName={userName} plan={plan}>
      <Cockpit userName={userName} report={report} latestReportId={latestReportId} seoScore={seoScore} />
    </DashboardShell>
  )
}
