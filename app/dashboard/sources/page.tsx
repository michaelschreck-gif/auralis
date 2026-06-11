import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

export const dynamic = "force-dynamic"

type SourceAgg = {
  domain: string
  count: number
  /** Sample URLs we've seen for this domain (max 3). */
  examples: string[]
}

function domainFromUrl(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function aggregateSources(reports: VisibilityReport[]): SourceAgg[] {
  const byDomain = new Map<string, SourceAgg>()

  for (const report of reports) {
    for (const qr of report.queryResults ?? []) {
      for (const raw of qr.signal?.citedSources ?? []) {
        const domain = domainFromUrl(raw)
        if (!domain) continue
        const existing = byDomain.get(domain)
        if (existing) {
          existing.count += 1
          if (existing.examples.length < 3 && !existing.examples.includes(raw)) {
            existing.examples.push(raw)
          }
        } else {
          byDomain.set(domain, {
            domain,
            count: 1,
            examples: [raw],
          })
        }
      }
    }
  }

  return Array.from(byDomain.values()).sort((a, b) => b.count - a.count)
}

export default async function SourcesPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let plan = "free"
  let sources: SourceAgg[] = []
  let reportCount = 0

  try {
    const [profileResult, reportsResult] = await Promise.all([
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
        .limit(20),
    ])

    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"
    const reports = (reportsResult.data ?? [])
      .map(r => r.raw_data as unknown as VisibilityReport | null)
      .filter((r): r is VisibilityReport => r !== null && typeof r === "object")
    reportCount = reports.length
    sources = aggregateSources(reports)
  } catch {
    // continue with empty defaults
  }

  return (
    <DashboardShell userName={userName} plan={plan}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#0f172a]">Quellen</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Welche Webseiten KI-Systeme nennen, wenn sie über dich sprechen.
          </p>
        </header>

        {reportCount === 0 ? (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-base font-medium text-[#0f172a]">
              Noch keine Analysen vorhanden.
            </p>
            <p className="text-sm text-[#64748b] mt-2">
              Sobald die KI deine Reputation analysiert, erscheinen hier genannte Quellen.{" "}
              <a
                href="/dashboard/analyze"
                className="text-[#7F77DD] hover:underline font-medium"
              >
                Erste Analyse starten →
              </a>
            </p>
          </section>
        ) : sources.length === 0 ? (
          <section className="bg-white rounded-2xl border border-[#CECBF6] bg-[#EEEDFE]/40 shadow-sm p-8">
            <p className="text-base font-medium text-[#0f172a]">
              Quellen erscheinen nur bei web-vernetzten KI-Modellen
            </p>
            <div className="text-sm text-[#475569] mt-3 space-y-3 leading-relaxed max-w-xl">
              <p>
                Deine Analysen laufen aktuell mit <span className="font-medium text-[#0f172a]">Claude</span>.
                Claude antwortet aus seinem Trainingswissen und gibt dabei – wie die meisten
                KI-Assistenten – normalerweise keine konkreten Webadressen an. Deshalb gibt es hier
                nichts auszuwerten, obwohl deine Analysen einwandfrei funktionieren.
              </p>
              <p>
                Echte Quell-Links liefern vor allem <span className="font-medium text-[#0f172a]">web-vernetzte
                Modelle wie Perplexity</span>, die live im Internet suchen. Sobald ein solches Modell für
                dein Konto aktiv ist, werden die genannten Webseiten hier automatisch gesammelt und nach
                Häufigkeit sortiert.
              </p>
            </div>
            <p className="text-xs text-[#94a3b8] mt-4">
              Tipp: Die tatsächlichen KI-Antworten hinter deinen Scores findest du unter{" "}
              <a href="/dashboard/responses" className="text-[#7F77DD] hover:underline font-medium">
                KI-Antworten
              </a>.
            </p>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
                Quellen-Häufigkeit
              </p>
              <span className="text-xs text-[#94a3b8]">
                aus {reportCount} {reportCount === 1 ? "Analyse" : "Analysen"}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {sources.map((s, i) => (
                <div key={s.domain} className="px-6 py-4 flex items-start gap-4">
                  <div className="w-6 text-sm text-[#94a3b8] font-medium tabular-nums flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0f172a]">
                      {s.domain}
                    </p>
                    {s.examples.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {s.examples.map(ex => (
                          <p key={ex} className="text-xs text-[#94a3b8] truncate">
                            {ex}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#EEEDFE] text-[#7F77DD] text-xs font-semibold tabular-nums">
                    {s.count}× zitiert
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {sources.length > 0 && (
          <p className="text-xs text-[#94a3b8]">
            Hinweis: Diese Liste zeigt Webadressen, die KI-Modelle in den Antworten der letzten{" "}
            {reportCount} Analyse{reportCount === 1 ? "" : "n"} genannt haben. Web-vernetzte Modelle
            (z.&nbsp;B. Perplexity) liefern hier deutlich mehr als reine Wissensmodelle wie Claude.
          </p>
        )}
      </div>
    </DashboardShell>
  )
}
