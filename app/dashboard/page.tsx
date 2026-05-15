import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import VisibilityCheck from "@/components/VisibilityCheck"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let profile = null
  let schedules: { id: string; name: string; query: string; language: string }[] = []

  try {
    const [profileResult, schedulesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, language")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("monitoring_schedules")
        .select("id, name, query, language")
        .eq("profile_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ])
    profile = profileResult.data
    schedules = schedulesResult.data ?? []
  } catch {
    // continue with empty defaults
  }

  return (
    <VisibilityCheck
      userName={profile?.full_name ?? ""}
      defaultLanguage={profile?.language === "en" ? "en" : "de"}
      schedules={schedules}
    />
  )
}
