import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import VisibilityCheck from "@/components/VisibilityCheck"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, { data: schedules }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, language")
      .eq("id", user.id)
      .single(),
    supabase
      .from("monitoring_schedules")
      .select("id, name, query, language")
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ])

  return (
    <VisibilityCheck
      userName={profile?.full_name ?? ""}
      defaultLanguage={profile?.language === "en" ? "en" : "de"}
      schedules={schedules ?? []}
    />
  )
}
