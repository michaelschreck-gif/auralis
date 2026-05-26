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
  let plan = "free"
  let schedules: { id: string; name: string; query: string; language: string }[] = []
  let report: VisibilityReport | null = null

  try {
    const [profileResult, schedulesResult, reportResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, plan")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("monitoring_schedules")
        .select("id, name, query, language")
        .eq("profile_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("visibility_reports")
        .select("raw_data")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"
    schedules = schedulesResult.data ?? []
    report = (reportResult.data?.raw_data ?? null) as VisibilityReport | null
  } catch {
    // continue with empty defaults
  }

  return (
    <DashboardShell userName={userName}>
      <Cockpit
        userName={userName}
        report={report}
        schedules={schedules}
        plan={plan}
      />
    </DashboardShell>
  )
}
