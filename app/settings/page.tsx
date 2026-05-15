import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import SettingsForm from "@/components/SettingsForm"

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "topics",  label: "Monitoring Topics" },
  { id: "plan",    label: "Plan" },
  { id: "danger",  label: "Danger Zone" },
]

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let profile = null
  let schedules: { id: string; name: string; query: string; frequency: string; language: string }[] = []

  try {
    const [profileResult, schedulesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, language, plan, timezone")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("monitoring_schedules")
        .select("id, name, query, frequency, language")
        .eq("profile_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ])
    profile = profileResult.data
    schedules = schedulesResult.data ?? []
  } catch {
    // continue with empty defaults
  }

  const panel = (
    <div className="py-2">
      {SECTIONS.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="block px-4 py-3 text-sm text-[#64748b] hover:text-[#0f172a] hover:bg-gray-50 transition-colors font-medium border-b border-gray-100 last:border-0"
        >
          {s.label}
        </a>
      ))}
    </div>
  )

  return (
    <DashboardShell
      userName={profile?.full_name ?? ""}
      panelHeader="Settings"
      panelContent={panel}
    >
      <SettingsForm
        userId={user.id}
        initialName={profile?.full_name ?? ""}
        initialEmail={profile?.email ?? user.email ?? ""}
        initialLanguage={profile?.language ?? "de"}
        initialTimezone={profile?.timezone ?? "Europe/Berlin"}
        plan={profile?.plan ?? "free"}
        schedules={schedules ?? []}
      />
    </DashboardShell>
  )
}
