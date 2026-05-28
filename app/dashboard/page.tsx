import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Cockpit from "@/components/Cockpit"
import DashboardShell from "@/components/DashboardShell"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

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
  let report: VisibilityReport | null = null
  let latestReportId: string | null = null

  try {
    const [profileResult, reportResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("visibility_reports")
        .select("id, raw_data")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    userName = profileResult.data?.full_name ?? ""
    report = (reportResult.data?.raw_data ?? null) as VisibilityReport | null
    latestReportId = reportResult.data?.id ?? null
  } catch {
    // continue with empty defaults
  }

  return (
    <DashboardShell userName={userName}>
      <Cockpit userName={userName} report={report} latestReportId={latestReportId} />
    </DashboardShell>
  )
}
