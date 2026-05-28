import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import type { MultiModelVisibilityReport, PerModelBreakdown } from "@/lib/auralis/runner"
import type { Database } from "@/lib/supabase/database.types"

type PlanType = Database["public"]["Enums"]["plan_type"]

type ModelInfo = {
  /** Matches providers.ts `ProviderId` */
  providerId: string
  name: string
  description: string
  color: string
  /** Tarif ab dem dieses Modell freigeschaltet ist. */
  unlocksOn: "free" | "starter" | "pro"
}

const MODELS: ModelInfo[] = [
  {
    providerId: "claude-sonnet",
    name: "Claude Sonnet",
    description: "Anthropic's Reasoning-Modell — treibt deine Auralis-Analysen an.",
    color: "#4F6EF7",
    unlocksOn: "free",
  },
  {
    providerId: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAIs Flaggschiff-Modell, weit verbreitet in Enterprise-Suchen.",
    color: "#10b981",
    unlocksOn: "starter",
  },
  {
    providerId: "perplexity-sonar",
    name: "Perplexity",
    description: "Web-vernetzte KI in Echtzeit für Brand Discovery.",
    color: "#8b5cf6",
    unlocksOn: "starter",
  },
  {
    providerId: "gemini-flash",
    name: "Gemini",
    description: "Googles multimodales Modell, treibt AI Overviews in der Suche.",
    color: "#ef4444",
    unlocksOn: "starter",
  },
]

/** Free: nur claude-sonnet aktiv. Starter+: alle. */
function isUnlocked(unlocksOn: ModelInfo["unlocksOn"], plan: PlanType): boolean {
  if (unlocksOn === "free") return true
  if (unlocksOn === "starter") return plan !== "free"
  if (unlocksOn === "pro") return plan === "pro" || plan === "enterprise"
  return false
}

function ModelCard({
  model,
  active,
  breakdown,
}: {
  model: ModelInfo
  active: boolean
  breakdown: PerModelBreakdown | null
}) {
  const initial = model.name[0] ?? "?"
  const score = breakdown?.overallScore ?? null
  const error = breakdown?.error ?? null

  return (
    <div className={`rounded-xl border p-6 transition-all ${
      active
        ? "border-gray-100 bg-white shadow-sm"
        : "border-gray-100 bg-[#f8f9fb] opacity-70"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold"
            style={{ background: `${model.color}18`, color: model.color }}
          >
            {initial}
          </div>
          <div>
            <p className="text-sm text-[#0f172a] font-medium">{model.name}</p>
            <p className="text-xs text-[#64748b] mt-0.5">{model.description}</p>
          </div>
        </div>
        {active ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 font-medium">
            Aktiv
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-[#94a3b8]">
            🔒 Starter
          </span>
        )}
      </div>

      {active && (
        <div className="space-y-3 mt-5 pt-5 border-t border-gray-100">
          {error ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
              Letzte Analyse fehlgeschlagen: {error.slice(0, 80)}
            </p>
          ) : score !== null ? (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748b]">Sichtbarkeits-Score</span>
                <span className="font-semibold" style={{ color: model.color }}>{score} / 100</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, background: model.color }}
                />
              </div>
              {breakdown && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Mini label="Erwähnt" value={`${breakdown.mentionRate}%`} />
                  <Mini label="Position" value={breakdown.averagePosition !== null ? `Ø ${breakdown.averagePosition.toFixed(1)}` : "—"} />
                </div>
              )}
              <p className="text-xs text-[#94a3b8]">
                Basierend auf deiner aktuellsten Analyse.
              </p>
            </>
          ) : (
            <p className="text-xs text-[#94a3b8]">
              Starte eine Analyse auf der{" "}
              <a href="/dashboard/analyze" className="text-[#4F6EF7] hover:underline font-medium">
                Analyse-Seite
              </a>
              , um deinen Score hier zu sehen.
            </p>
          )}
        </div>
      )}

      {!active && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-[#94a3b8]">
            Verfügbar in den Tarifen Starter, Pro &amp; Enterprise.
          </p>
        </div>
      )}
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f8f9fb] border border-gray-100 px-2 py-1.5">
      <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-xs text-[#0f172a] font-medium mt-0.5">{value}</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function AiVisibilityPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let plan: PlanType = "free"
  let perModelBreakdown: PerModelBreakdown[] = []

  try {
    const [profileResult, reportResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, plan")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("visibility_reports")
        .select("raw_data")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    userName = profileResult.data?.full_name ?? ""
    plan = (profileResult.data?.plan ?? "free") as PlanType
    const rawReport = reportResult.data?.raw_data as unknown as MultiModelVisibilityReport | null
    perModelBreakdown = rawReport?.perModelBreakdown ?? []
  } catch {
    // continue with empty defaults
  }

  // Build a lookup so each card can find its own breakdown
  const breakdownByProvider = new Map<string, PerModelBreakdown>()
  perModelBreakdown.forEach(b => breakdownByProvider.set(b.provider, b))

  const panel = (
    <div className="py-2">
      {MODELS.map(m => {
        const active = isUnlocked(m.unlocksOn, plan)
        return (
          <div key={m.providerId}
            className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
              style={{ background: `${m.color}18`, color: m.color }}
            >
              {m.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#0f172a] truncate font-medium">{m.name}</p>
            </div>
            {active
              ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"/>
              : <span className="text-xs text-[#94a3b8]">🔒</span>
            }
          </div>
        )
      })}
    </div>
  )

  return (
    <DashboardShell
      userName={userName}
      panelHeader="KI-Modelle"
      panelContent={panel}
    >
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#0f172a]">KI-Sichtbarkeit pro Modell</h1>
          <p className="text-[#64748b] text-sm mt-1">
            Wie jedes KI-System deine Personal Brand wahrnimmt.{" "}
            {plan === "free" && (
              <span className="text-[#94a3b8]">
                Free-Tarif misst nur Claude — <a href="/#preise" className="text-[#4F6EF7] hover:underline">Starter wechselt auf Multi-Modell</a>.
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODELS.map(m => {
            const active = isUnlocked(m.unlocksOn, plan)
            const breakdown = active ? breakdownByProvider.get(m.providerId) ?? null : null
            return (
              <ModelCard
                key={m.providerId}
                model={m}
                active={active}
                breakdown={breakdown}
              />
            )
          })}
        </div>

        <div className="mt-8 rounded-xl border border-gray-100 bg-[#f8f9fb] p-5">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2 font-medium">Was das bedeutet</p>
          <p className="text-sm text-[#64748b] leading-relaxed">
            KI-Sichtbarkeit misst, wie prominent dein Name und deine Expertise in Antworten von KI-Systemen erscheinen.
            Ein höherer Score bedeutet, dass KI-Assistenten dich mit höherer Wahrscheinlichkeit empfehlen, wenn jemand nach deinen Themen fragt.
            Multi-Modell-Tracking ist ab Tarif Starter freigeschaltet — dein Aura-Score ist dann der Durchschnitt über alle aktiven Modelle.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
