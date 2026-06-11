import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import RecommendationRunButton from "@/components/RecommendationRunButton"
import {
  probabilityBand,
  ROLE_DEFINITIONS,
  type RoleProbability,
} from "@/lib/auralis/recommendation-probability"

export const dynamic = "force-dynamic"

function parseRoles(raw: unknown): RoleProbability[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((r): r is RoleProbability => !!r && typeof (r as { roleId?: unknown }).roleId === "string")
    .map(r => ({
      roleId: r.roleId,
      label: String(r.label ?? r.roleId),
      hint: String(r.hint ?? ""),
      probability: Math.max(0, Math.min(100, Math.round(Number(r.probability) || 0))),
      mentions: Math.max(0, Math.round(Number(r.mentions) || 0)),
      samples: Math.max(0, Math.round(Number(r.samples) || 0)),
      bestPosition: r.bestPosition == null ? null : Math.round(Number(r.bestPosition)),
    }))
}

function Ring({ value, color }: { value: number; color: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="flex-shrink-0">
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 44 44)"
      />
      <text x="44" y="49" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">{value}%</text>
    </svg>
  )
}

export default async function RecommendedPage() {
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
  let hasTopics = false
  let roles: RoleProbability[] = []
  let overall = 0
  let generatedAt: string | null = null

  try {
    const [profileResult, schedulesResult, reportResult] = await Promise.all([
      supabase.from("profiles").select("full_name, plan").eq("id", user!.id).single(),
      supabase.from("monitoring_schedules").select("id").eq("profile_id", user!.id).eq("is_active", true).limit(1),
      supabase
        .from("recommendation_reports")
        .select("overall_probability, roles, created_at")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"
    hasTopics = (schedulesResult.data ?? []).length > 0
    roles = parseRoles(reportResult.data?.roles)
    overall = Math.round(Number(reportResult.data?.overall_probability) || 0)
    generatedAt = reportResult.data?.created_at ?? null
  } catch {
    // defaults
  }

  const isPro = plan === "pro" || plan === "enterprise"
  const hasData = roles.length > 0
  const band = probabilityBand(overall)

  return (
    <DashboardShell userName={userName} plan={plan}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#1B1830]">Wirst du empfohlen?</h1>
          <p className="text-sm text-[#6B6790] mt-1 max-w-2xl leading-relaxed">
            Wenn jemand KI fragt „Wen würdest du als Keynote-Speaker / Berater / Trainer / Podcast-Gast
            für mein Thema empfehlen?" — wie oft fällt dein Name? Genau diese Frage entscheidet über
            Aufträge, Bühnen und Gagen.
          </p>
        </header>

        {!isPro ? (
          // Paywall-Vorschau für Free/Starter
          <section className="rounded-2xl border border-[#EEEDFE] bg-white p-6 md:p-8">
            <span className="inline-block text-[11px] font-semibold text-[#534AB7] bg-[#EEEDFE] rounded-full px-2.5 py-1">
              🔒 Pro-Feature
            </span>
            <h2 className="text-lg font-semibold text-[#1B1830] mt-3">
              Miss deine Empfehlungs-Wahrscheinlichkeit
            </h2>
            <p className="text-sm text-[#6B6790] mt-1.5 leading-relaxed max-w-xl">
              Halo stellt KI gezielte Empfehlungsfragen für vier Rollen und misst, in wie viel Prozent
              der Fälle du genannt wirst — pro Rolle und über alle Themen. Verfügbar ab Tarif Pro.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {ROLE_DEFINITIONS.map(r => (
                <div key={r.id} className="rounded-xl bg-[#F4F2FE] border border-[#EEEDFE] p-3">
                  <div className="text-sm font-medium text-[#1B1830]">{r.label}</div>
                  <div className="text-[11px] text-[#9A95BE] mt-1 leading-tight">{r.hint}</div>
                </div>
              ))}
            </div>
            <a
              href="/#preise"
              className="inline-block mt-6 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7F77DD] hover:bg-[#534AB7] transition-colors"
            >
              Auf Pro upgraden →
            </a>
          </section>
        ) : (
          <>
            {/* Hero mit Gesamt-Wahrscheinlichkeit + Run-Button */}
            <section className="rounded-2xl bg-[#26215C] text-white p-6 md:p-7">
              <div className="flex items-center gap-5">
                {hasData ? (
                  <Ring value={overall} color={band.color} />
                ) : (
                  <div className="w-[88px] h-[88px] rounded-full border-4 border-white/20 flex items-center justify-center text-white/50 text-xs flex-shrink-0">
                    noch —
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-[#CECBF6]">
                    Gesamt-Empfehlungs-Quote
                  </div>
                  {hasData ? (
                    <>
                      <div className="text-lg font-semibold mt-0.5">{band.label}</div>
                      <p className="text-sm text-[#CECBF6] mt-1 leading-relaxed">
                        Über vier Rollen gemittelt. Stärkste Rolle:{" "}
                        <span className="text-white font-medium">
                          {[...roles].sort((a, b) => b.probability - a.probability)[0]?.label}
                        </span>.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[#CECBF6] mt-1 leading-relaxed max-w-md">
                      Noch keine Messung. Starte die Analyse — Halo fragt KI für jede Rolle und jedes
                      Thema und misst deine Trefferquote.
                    </p>
                  )}
                  <div className="mt-4">
                    <RecommendationRunButton
                      hasTopics={hasTopics}
                      label={hasData ? "Neu messen" : "Empfehlungs-Quote messen"}
                    />
                  </div>
                  {generatedAt && (
                    <p className="text-[11px] text-[#AFA9EC] mt-3">
                      Zuletzt gemessen am{" "}
                      {new Date(generatedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Pro Rolle */}
            {hasData && (
              <div className="grid sm:grid-cols-2 gap-4">
                {roles.map(r => {
                  const b = probabilityBand(r.probability)
                  return (
                    <section key={r.roleId} className="bg-white rounded-2xl border border-[#EEEDFE] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-[#1B1830]">{r.label}</h3>
                          <p className="text-[11px] text-[#9A95BE] mt-0.5">{r.hint}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-semibold tabular-nums" style={{ color: b.color }}>
                            {r.probability}%
                          </div>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-[#EEEDFE] overflow-hidden mt-3">
                        <div className="h-2 rounded-full" style={{ width: `${r.probability}%`, background: b.color }} />
                      </div>
                      <div className="flex items-center justify-between mt-2.5 text-[11px] text-[#6B6790]">
                        <span style={{ color: b.color }} className="font-medium">{b.label}</span>
                        <span>
                          {r.mentions}/{r.samples} Abfragen
                          {r.bestPosition !== null ? ` · beste Position #${r.bestPosition}` : ""}
                        </span>
                      </div>
                    </section>
                  )
                })}
              </div>
            )}

            <p className="text-xs text-[#9A95BE] leading-relaxed">
              Gemessen, indem KI mehrere Empfehlungsfragen pro Rolle und Thema gestellt werden (Claude
              Sonnet). Die Quote ist der Anteil der Abfragen, in denen dein Name genannt wird — ein
              Richtwert, kein garantierter Wert.
            </p>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
