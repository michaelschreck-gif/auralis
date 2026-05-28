import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import SettingsForm from "@/components/SettingsForm"
import ApiKeysBlock, { type ApiKeyRow } from "@/components/ApiKeysBlock"
import PublicProfileBlock from "@/components/PublicProfileBlock"
import { isPlanEligible } from "@/lib/api-auth"
import type { Database } from "@/lib/supabase/database.types"

type PlanType = Database["public"]["Enums"]["plan_type"]

const SECTIONS = [
  { id: "profile",        label: "Profil" },
  { id: "topics",         label: "Überwachte Themen" },
  { id: "plan",           label: "Tarif" },
  { id: "public-profile", label: "Public Profile" },
  { id: "api",            label: "API-Keys" },
  { id: "danger",         label: "Gefahrenzone" },
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
  let apiKeys: ApiKeyRow[] = []

  try {
    const [profileResult, schedulesResult, apiKeysResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, language, plan, timezone, public_slug, public_profile_enabled")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("monitoring_schedules")
        .select("id, name, query, frequency, language")
        .eq("profile_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("api_keys")
        .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false }),
    ])
    profile = profileResult.data
    schedules = schedulesResult.data ?? []
    apiKeys = (apiKeysResult.data ?? []) as ApiKeyRow[]
  } catch {
    // continue with empty defaults
  }

  const plan: PlanType = (profile?.plan ?? "free") as PlanType
  const isEligible = isPlanEligible(plan)

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
      panelHeader="Einstellungen"
      panelContent={panel}
    >
      <SettingsForm
        userId={user.id}
        initialName={profile?.full_name ?? ""}
        initialEmail={profile?.email ?? user.email ?? ""}
        initialLanguage={profile?.language ?? "de"}
        initialTimezone={profile?.timezone ?? "Europe/Berlin"}
        plan={plan}
        schedules={schedules ?? []}
      />

      {/* Public Profile + API-Keys live below the form; match its px-8/max-w-2xl rhythm. */}
      <div className="px-8 pb-8 max-w-2xl space-y-6">
        <PublicProfileBlock
          initialEnabled={profile?.public_profile_enabled ?? false}
          initialSlug={profile?.public_slug ?? null}
          fullName={profile?.full_name ?? null}
        />
        <ApiKeysBlock
          keys={apiKeys}
          plan={plan}
          isEligible={isEligible}
        />
      </div>
    </DashboardShell>
  )
}
