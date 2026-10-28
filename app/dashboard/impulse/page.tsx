import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import { buildImpulses, PATTERN_LABELS, type ImpulseSource, type ImpulseSummary } from "@/lib/auralis/impulses"
import { adoptPattern } from "./actions"

export const dynamic = "force-dynamic"

/** Wie viele der jüngsten Analysen in die Impulse einfließen. */
const REPORTS_CONSIDERED = 10

export default async function ImpulsePage() {
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
  let summary: ImpulseSummary = { people: [], patterns: [], answersAnalyzed: 0 }

  try {
    const [profileResult, schedulesResult, reportsResult] = await Promise.all([
      supabase.from("profiles").select("full_name, plan").eq("id", user!.id).single(),
      supabase.from("monitoring_schedules").select("id, query").eq("profile_id", user!.id),
      supabase
        .from("visibility_reports")
        .select("id, schedule_id")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(REPORTS_CONSIDERED),
    ])
    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"

    const topicBySchedule = new Map((schedulesResult.data ?? []).map(s => [s.id, s.query]))
    const reports = reportsResult.data ?? []
    const topicByReport = new Map(
      reports.map(r => [r.id, r.schedule_id ? topicBySchedule.get(r.schedule_id) ?? null : null]),
    )

    if (reports.length > 0) {
      const { data: rows } = await supabase
        .from("query_results")
        .select("prompt, response, report_id")
        .in("report_id", reports.map(r => r.id))
      const sources: ImpulseSource[] = (rows ?? []).map(r => ({
        prompt: r.prompt,
        response: r.response,
        topic: topicByReport.get(r.report_id) ?? null,
      }))
      summary = buildImpulses(sources, userName)
    }
  } catch {
    // continue with empty defaults
  }

  return (
    <DashboardShell userName={userName} plan={plan}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <header>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Impulse</span>
          <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">
            Wer auf deinen Themen schon sichtbar ist.
          </h1>
          <p className="text-sm text-[#6B625A] mt-2.5 max-w-2xl leading-relaxed">
            Diese Personen nennt die KI in den Antworten zu deinen Themen. Sie sind keine Konkurrenz, sondern Inspiration:
            Schau dir an, womit sie sichtbar geworden sind, und übernimm, was zu dir passt.
          </p>
        </header>

        {summary.people.length === 0 ? (
          <div className="rounded-3xl border border-[#E9E1D3] bg-white p-8 text-center">
            <p className="text-base font-semibold text-[#0E1916]">Noch keine Impulse.</p>
            <p className="text-sm text-[#6B625A] mt-2 max-w-md mx-auto">
              {summary.answersAnalyzed === 0
                ? "Impulse entstehen aus deinen Analysen. Starte eine Analyse, dann zeigen wir dir hier, wen die KI zu deinen Themen nennt."
                : "In deinen bisherigen KI-Antworten wurden keine anderen Personen namentlich genannt. Mit der nächsten Analyse kann sich das ändern."}
            </p>
            <Link
              href="/dashboard/analyze"
              className="inline-block mt-5 px-6 py-2.5 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-bold transition-colors"
            >
              Analyse starten →
            </Link>
          </div>
        ) : (
          <>
            {summary.patterns.length > 0 && (
              <section className="rounded-3xl border border-[#E9E1D3] bg-white p-6">
                <h2 className="text-lg leading-tight text-[#0E1916]">Was diese Personen sichtbar macht</h2>
                <p className="text-[13px] text-[#5E6563] mt-1">
                  Häufige Muster in den Beschreibungen der KI. Ein Klick macht daraus eine Maßnahme für dich.
                </p>
                <ul className="mt-5 divide-y divide-[#F1ECE2]">
                  {summary.patterns.slice(0, 5).map(p => (
                    <li key={p.key} className="py-3 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-sm font-bold text-[#0E1916]">{p.label}</div>
                        <div className="text-[13px] text-[#5E6563]">
                          {p.people} {p.people === 1 ? "Person" : "Personen"} · {p.hint}
                        </div>
                      </div>
                      <form action={adoptPattern}>
                        <input type="hidden" name="pattern" value={p.key} />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-full border border-[#E9E1D3] text-[13px] font-semibold text-[#0E1916] hover:bg-[#F6F3EC] transition-colors"
                        >
                          Als Maßnahme übernehmen
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-lg text-[#0E1916]">Personen, die die KI nennt</h2>
              {summary.people.map(person => (
                <article key={person.name} className="rounded-2xl border border-[#E9E1D3] bg-white p-5">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <h3 className="text-base font-bold text-[#0E1916]">{person.name}</h3>
                    <span className="text-[12.5px] text-[#9A9089]">
                      {person.mentions === 1 ? "in 1 KI-Antwort genannt" : `in ${person.mentions} KI-Antworten genannt`}
                      {person.topics.length > 0 && <> · {person.topics.join(", ")}</>}
                    </span>
                  </div>
                  {person.contexts.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {person.contexts.map(c => (
                        <p key={c} className="text-sm text-[#3D4A46] leading-relaxed">„{c}“</p>
                      ))}
                    </div>
                  )}
                  {person.patterns.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {person.patterns.map(k => (
                        <span key={k} className="px-2.5 py-1 rounded-full bg-[#F6F3EC] text-[12px] font-medium text-[#3D4A46]">
                          {PATTERN_LABELS[k].label}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </section>

            <p className="text-[12px] text-[#9A9089] leading-relaxed">
              Grundlage: {summary.answersAnalyzed} KI-Antworten aus deinen letzten Analysen. Die Beschreibungen stammen
              wörtlich aus den KI-Antworten und können ungenau sein. Halo bewertet diese Personen nicht und erstellt keine
              Profile über sie.
            </p>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
