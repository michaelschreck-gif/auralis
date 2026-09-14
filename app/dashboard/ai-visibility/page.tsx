import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import type { MultiModelVisibilityReport, PerModelBreakdown } from "@/lib/auralis/runner"
import type { Database } from "@/lib/supabase/database.types"
import ScoreDerivationTable from "@/components/ScoreDerivation"
import { computeScoreDerivationFromSignals } from "@/lib/auralis/master-scores"

type PlanType = Database["public"]["Enums"]["plan_type"]

type ModelInfo = {
  /** Matches providers.ts `ProviderId` */
  providerId: string
  name: string
  description: string
  /** Brandkit-Ton nach Freischalt-Tarif — dieselbe Logik wie im Modelle-Abschnitt der Landingpage. */
  color: string
  /** Tarif ab dem dieses Modell freigeschaltet ist. */
  unlocksOn: "free" | "starter" | "pro"
}

// Brandkit-Farbe nach Tarif (statt einer bunten Rainbow-Palette pro Anbieter) —
// dieselbe Logik wie im Multi-Modell-Tracking-Abschnitt der Landingpage.
const TIER_COLOR: Record<ModelInfo["unlocksOn"], string> = {
  free: "#FA5935",
  starter: "#6D8C8D",
  pro: "#3A4442",
}

const MODELS: ModelInfo[] = [
  {
    providerId: "claude-sonnet",
    name: "Claude Sonnet",
    description: "Anthropic's Reasoning-Modell — treibt deine Halo-Analysen an.",
    color: TIER_COLOR.free,
    unlocksOn: "free",
  },
  {
    providerId: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAIs Flaggschiff-Modell, weit verbreitet in Enterprise-Suchen.",
    color: TIER_COLOR.starter,
    unlocksOn: "starter",
  },
  {
    providerId: "perplexity-sonar",
    name: "Perplexity",
    description: "Web-vernetzte KI in Echtzeit für Brand Discovery.",
    color: TIER_COLOR.starter,
    unlocksOn: "starter",
  },
  {
    providerId: "gemini-flash",
    name: "Gemini",
    description: "Googles multimodales Modell, treibt AI Overviews in der Suche.",
    color: TIER_COLOR.starter,
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

type CardState =
  | { kind: "locked" }                // Plan unlockt dieses Modell nicht
  | { kind: "noReport" }              // Plan unlockt, aber noch nie eine Analyse gemacht
  | { kind: "providerMissing" }       // Plan unlockt + Analyse vorhanden, aber dieser Provider lief nicht (kein API-Key auf dem Server)
  | { kind: "error"; message: string } // Provider lief, aber API gab einen Fehler zurück
  | { kind: "score"; breakdown: PerModelBreakdown } // Alles ok

function ModelCard({
  model,
  state,
}: {
  model: ModelInfo
  state: CardState
}) {
  const initial = model.name[0] ?? "?"
  const active = state.kind !== "locked"

  return (
    <div className={`rounded-3xl border p-6 transition-colors ${
      active
        ? "border-[#E9E1D3] bg-white"
        : "border-[#E9E1D3] bg-[#FAF8F3] opacity-70"
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
            <p className="text-sm text-[#0E1916] font-medium">{model.name}</p>
            <p className="text-xs text-[#6B625A] mt-0.5">{model.description}</p>
          </div>
        </div>
        {state.kind === "score" && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#E9F0F0] text-[#1C2A2A] border border-[#C7D9D9] font-medium">
            Aktiv
          </span>
        )}
        {state.kind === "error" && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#F3EFE6] text-[#6B625A]">
            Zurzeit nicht verfügbar
          </span>
        )}
        {state.kind === "providerMissing" && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#F3EFE6] text-[#6B625A]">
            Nicht aktiv
          </span>
        )}
        {state.kind === "noReport" && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#FDE7E0] text-[#C8431F] border border-[#FBCBB8] font-medium">
            Bereit
          </span>
        )}
        {state.kind === "locked" && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#F3EFE6] text-[#9A9089]">
            🔒 Starter
          </span>
        )}
      </div>

      <div className="space-y-3 mt-5 pt-5 border-t border-[#F0EAE0]">
        {state.kind === "score" && (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B625A]">Reputations-Score</span>
              <span className="font-semibold" style={{ color: model.color }}>{state.breakdown.overallScore} / 100</span>
            </div>
            <div className="h-1.5 bg-[#F3EFE6] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${state.breakdown.overallScore}%`, background: model.color }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Mini label="Erwähnt" value={`${state.breakdown.mentionRate}%`} />
              <Mini label="Position" value={state.breakdown.averagePosition !== null ? `Ø ${state.breakdown.averagePosition.toFixed(1)}` : "—"} />
            </div>
            <details className="group mt-1">
              <summary className="text-xs text-[#FA5935] hover:underline cursor-pointer list-none flex items-center gap-1">
                <span aria-hidden className="transition-transform group-open:rotate-90">›</span>
                So kommt dieser Score zustande
              </summary>
              <div className="mt-2">
                <ScoreDerivationTable
                  derivation={computeScoreDerivationFromSignals(
                    "aura",
                    state.breakdown.scoreBreakdown,
                    state.breakdown.mentionRate,
                  )}
                  compact
                />
              </div>
            </details>
          </>
        )}

        {state.kind === "error" && (
          <p className="text-xs text-[#6B625A]">
            Dieses Modell konnte bei der letzten Analyse nicht abgefragt werden und wird beim nächsten Lauf automatisch erneut versucht.
          </p>
        )}

        {state.kind === "providerMissing" && (
          <p className="text-xs text-[#6B625A]">
            Dieser Provider ist auf dem Server noch nicht konfiguriert. Sobald der API-Key gesetzt ist,
            wird er ab der nächsten Analyse automatisch mitgemessen.
          </p>
        )}

        {state.kind === "noReport" && (
          <p className="text-xs text-[#9A9089]">
            Starte eine Analyse auf der{" "}
            <a href="/dashboard/analyze" className="text-[#FA5935] hover:underline font-medium">
              Analyse-Seite
            </a>
            , um deinen Score hier zu sehen.
          </p>
        )}

        {state.kind === "locked" && (
          <p className="text-xs text-[#9A9089]">
            Verfügbar in den Tarifen Starter, Pro &amp; Enterprise.{" "}
            <a href="/#preise" className="text-[#FA5935] hover:underline font-medium">
              Upgrade →
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#FAF8F3] border border-[#E9E1D3] px-2.5 py-1.5">
      <p className="text-[10px] text-[#9A9089] uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-xs text-[#0E1916] font-medium mt-0.5">{value}</p>
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
  /** True wenn die jüngste Analyse mit dem neuen Multi-Modell-Runner gelaufen ist. */
  let hasMultiModelReport = false

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
    hasMultiModelReport = perModelBreakdown.length > 0
  } catch {
    // continue with empty defaults
  }

  // Build a lookup so each card can find its own breakdown
  const breakdownByProvider = new Map<string, PerModelBreakdown>()
  perModelBreakdown.forEach(b => breakdownByProvider.set(b.provider, b))

  /**
   * Bestimmt den Card-State für ein Modell. Reihenfolge der Checks:
   *  1. Plan unlockt nicht → locked
   *  2. Provider hat erfolgreichen Score → score
   *  3. Provider hat Fehler-Eintrag → error
   *  4. Plan unlockt, noch keine Multi-Modell-Analyse vorhanden → noReport
   *  5. Plan unlockt, Multi-Modell-Analyse da, Provider fehlt → providerMissing
   *     (= Server-seitig nicht konfiguriert)
   */
  function deriveCardState(m: ModelInfo): CardState {
    if (!isUnlocked(m.unlocksOn, plan)) return { kind: "locked" }
    const breakdown = breakdownByProvider.get(m.providerId)
    if (breakdown) {
      if (breakdown.error) return { kind: "error", message: breakdown.error }
      return { kind: "score", breakdown }
    }
    if (!hasMultiModelReport) return { kind: "noReport" }
    return { kind: "providerMissing" }
  }

  const panel = (
    <div className="py-2">
      {MODELS.map(m => {
        const active = isUnlocked(m.unlocksOn, plan)
        return (
          <div key={m.providerId}
            className="px-4 py-3 border-b border-[#F0EAE0] flex items-center gap-3 hover:bg-[#FAF8F3] transition-colors">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
              style={{ background: `${m.color}18`, color: m.color }}
            >
              {m.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#0E1916] truncate font-medium">{m.name}</p>
            </div>
            {active
              ? <span className="w-1.5 h-1.5 rounded-full bg-[#FA5935] flex-shrink-0"/>
              : <span className="text-xs text-[#9A9089]">🔒</span>
            }
          </div>
        )
      })}
    </div>
  )

  return (
    <DashboardShell
      userName={userName}
      plan={plan}
      panelHeader="KI-Modelle"
      panelContent={panel}
    >
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">KI-Reputation</span>
          <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">
            Wie jedes Modell dich sieht.
          </h1>
          <p className="text-[#6B625A] text-sm mt-2.5 max-w-xl leading-relaxed">
            Wie jedes KI-System deine Personal Brand wahrnimmt.{" "}
            {plan === "free" && (
              <span className="text-[#9A9089]">
                Free-Tarif misst nur Claude — <a href="/#preise" className="text-[#FA5935] hover:underline">Starter wechselt auf Multi-Modell</a>.
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODELS.map(m => (
            <ModelCard
              key={m.providerId}
              model={m}
              state={deriveCardState(m)}
            />
          ))}
        </div>

        {(() => {
          const ok = perModelBreakdown.filter(b => !b.error)
          if (ok.length < 1) return null
          const mean = Math.round(ok.reduce((a, b) => a + b.overallScore, 0) / ok.length)
          return (
            <div className="mt-6 rounded-3xl border border-[#FBCBB8] bg-gradient-to-br from-[#FDE7E0] to-[#F3EFE6] p-6">
              <p className="text-xs text-[#C8431F] uppercase tracking-wider mb-2.5 font-semibold">
                So entsteht dein Halo Score aus den Modellen
              </p>
              <p className="text-sm text-[#0E1916] leading-relaxed mb-3.5">
                Dein Halo Score ist der <span className="font-medium">Durchschnitt</span> der
                Reputations-Scores aller aktiven Modelle der letzten Analyse.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {ok.map((b, i) => (
                  <span key={b.provider} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-[#9A9089]">+</span>}
                    <span className="px-2 py-1 rounded-md bg-white border border-[#E9E1D3] tabular-nums">
                      <span className="text-[#6B625A]">{b.label}:</span>{" "}
                      <span className="font-semibold text-[#0E1916]">{b.overallScore}</span>
                    </span>
                  </span>
                ))}
                <span className="text-[#9A9089]">÷ {ok.length}</span>
                <span className="text-[#9A9089]">=</span>
                <span className="px-2.5 py-1 rounded-md bg-[#FA5935] text-white font-semibold tabular-nums">
                  {mean}
                </span>
              </div>
            </div>
          )
        })()}

        <div className="mt-4 rounded-3xl border border-[#E9E1D3] bg-[#FAF8F3] p-6">
          <p className="text-xs text-[#9A9089] uppercase tracking-wider mb-2.5 font-semibold">Was das bedeutet</p>
          <p className="text-sm text-[#6B625A] leading-relaxed">
            KI-Reputation misst, wie prominent dein Name und deine Expertise in Antworten von KI-Systemen erscheinen.
            Ein höherer Score bedeutet, dass KI-Assistenten dich mit höherer Wahrscheinlichkeit empfehlen, wenn jemand nach deinen Themen fragt.
            Multi-Modell-Tracking ist ab Tarif Starter freigeschaltet — dein Halo-Score ist dann der Durchschnitt über alle aktiven Modelle.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
