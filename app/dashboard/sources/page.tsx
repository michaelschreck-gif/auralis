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
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Quellen</span>
          <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">
            Woher KI ihr Wissen über dich bezieht.
          </h1>
          <p className="text-sm text-[#6B625A] mt-2.5">
            Welche Webseiten KI-Systeme nennen, wenn sie über dich sprechen.
          </p>
        </header>

        {reportCount === 0 ? (
          <section className="bg-white rounded-3xl border border-[#E9E1D3] p-12 text-center">
            <p className="text-base font-medium text-[#0E1916]">
              Noch keine Analysen vorhanden.
            </p>
            <p className="text-sm text-[#6B625A] mt-2">
              Sobald die KI deine Reputation analysiert, erscheinen hier genannte Quellen.{" "}
              <a
                href="/dashboard/analyze"
                className="text-[#FA5935] hover:underline font-medium"
              >
                Erste Analyse starten →
              </a>
            </p>
          </section>
        ) : sources.length === 0 ? (
          <section className="rounded-3xl border border-[#FBCBB8] bg-gradient-to-br from-[#FDE7E0] to-[#F3EFE6] p-8">
            <p className="text-base font-medium text-[#0E1916]">
              Quellen erscheinen nur bei web-vernetzten KI-Modellen
            </p>
            <div className="text-sm text-[#5C2A12] mt-3 space-y-3 leading-relaxed max-w-xl">
              <p>
                Deine Analysen laufen aktuell mit <span className="font-medium text-[#0E1916]">Claude</span>.
                Claude antwortet aus seinem Trainingswissen und gibt dabei – wie die meisten
                KI-Assistenten – normalerweise keine konkreten Webadressen an. Deshalb gibt es hier
                nichts auszuwerten, obwohl deine Analysen einwandfrei funktionieren.
              </p>
              <p>
                Echte Quell-Links liefern vor allem <span className="font-medium text-[#0E1916]">web-vernetzte
                Modelle wie Perplexity</span>, die live im Internet suchen. Sobald ein solches Modell für
                dein Konto aktiv ist, werden die genannten Webseiten hier automatisch gesammelt und nach
                Häufigkeit sortiert.
              </p>
            </div>
            <p className="text-xs text-[#8A5A0E] mt-4">
              Tipp: Die tatsächlichen KI-Antworten hinter deinen Scores findest du unter{" "}
              <a href="/dashboard/responses" className="text-[#FA5935] hover:underline font-medium">
                KI-Antworten
              </a>.
            </p>
          </section>
        ) : (
          <section className="bg-white rounded-3xl border border-[#E9E1D3] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0EAE0] flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089]">
                Quellen-Häufigkeit
              </p>
              <span className="text-xs text-[#9A9089]">
                aus {reportCount} {reportCount === 1 ? "Analyse" : "Analysen"}
              </span>
            </div>
            <div className="divide-y divide-[#F0EAE0]">
              {sources.map((s, i) => (
                <div key={s.domain} className="px-6 py-4 flex items-start gap-4">
                  <div className="w-6 text-sm text-[#9A9089] font-medium tabular-nums flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0E1916]">
                      {s.domain}
                    </p>
                    {s.examples.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {s.examples.map(ex => (
                          <p key={ex} className="text-xs text-[#9A9089] truncate">
                            {ex}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#FDE7E0] text-[#C8431F] text-xs font-semibold tabular-nums">
                    {s.count}× zitiert
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {sources.length > 0 && (
          <p className="text-xs text-[#9A9089]">
            Hinweis: Diese Liste zeigt Webadressen, die KI-Modelle in den Antworten der letzten{" "}
            {reportCount} Analyse{reportCount === 1 ? "" : "n"} genannt haben. Web-vernetzte Modelle
            (z.&nbsp;B. Perplexity) liefern hier deutlich mehr als reine Wissensmodelle wie Claude.
          </p>
        )}
      </div>
    </DashboardShell>
  )
}
