import { createHaloServerClient } from "@/lib/supabase/halo"
import { serpProvider, type SeoRunOutcome } from "@/lib/auralis/seo-providers"
import { SEO_FACTOR_META, type SeoFactorKey, type SeoSignals } from "@/lib/auralis/seo-score"
import { bandFor } from "@/lib/halo/score"
import { GOOGLE_INTERVAL_DAYS } from "@/lib/halo/google"
import GoogleMeasureButton from "@/components/halo/GoogleMeasureButton"
import { EmptyState, PageHeader, card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Google-Sichtbarkeit · Halo" }
export const maxDuration = 120

export default async function GooglePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const { data } = await db
    .from("google_measurements")
    .select("score, signals, raw, created_at")
    .eq("person_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
  const latest = data?.[0]
  const configured = serpProvider.isConfigured()

  const header = (
    <PageHeader
      eyebrow="Google-Sichtbarkeit"
      title="Wie du in der Google-Suche dastehst"
      text="Was jemand findet, der dich googelt: Wie viele der ersten Treffer zu deinem Namen von dir handeln, wo du bei „Name + Thema“ stehst, ob es ein Knowledge Panel gibt und ob dich Googles KI-Übersicht nennt. Zählt mit 30 % in den Halo Score."
      action={configured ? <GoogleMeasureButton personId={id} /> : undefined}
    />
  )

  if (!latest) {
    return (
      <div className="max-w-4xl space-y-6">
        {header}
        <EmptyState
          title={configured ? "Noch keine Google-Messung" : "Noch nicht angebunden"}
          text={
            configured
              ? "Starte die erste Google-Messung. Sie dauert etwa eine halbe Minute."
              : "Für die Google-Messung fehlt noch der Zugang zum Suchdaten-Anbieter. Bis dahin steht diese Säule im Halo Score auf „nicht gemessen“ und zählt nicht mit – sie drückt den Score also nicht."
          }
        />
      </div>
    )
  }

  const signals = (latest.signals ?? {}) as SeoSignals
  const raw = latest.raw as unknown as SeoRunOutcome | null
  const perTopic = raw?.perTopic ?? []
  const nameSearch = raw?.nameSearch
  const factors = (Object.keys(SEO_FACTOR_META) as SeoFactorKey[]).filter(k => typeof signals[k] === "number")

  return (
    <div className="max-w-4xl space-y-6">
      {header}
      <section className={`${card} p-6 flex items-center gap-6`}>
        <span className="text-5xl font-semibold tabular-nums text-[#0E1916]">{latest.score ?? "–"}</span>
        <div>
          {latest.score !== null && <span className="block text-lg font-semibold text-[#0E1916]">{bandFor(latest.score).label}</span>}
          <span className="block text-sm text-[#6B625A]">
            Gemessen am {formatDate(latest.created_at)} · wird automatisch alle {GOOGLE_INTERVAL_DAYS} Tage neu gemessen
          </span>
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Woraus sich der Wert zusammensetzt</h2>
        <ul className="mt-4 space-y-3">
          {factors.map(k => (
            <li key={k}>
              <div className="flex justify-between text-sm">
                <span className="text-[#0E1916]">{SEO_FACTOR_META[k].label}</span>
                <span className="tabular-nums text-[#6B625A]">{Math.round(signals[k] as number)}</span>
              </div>
              <p className="text-xs text-[#9A9089] mt-0.5">{SEO_FACTOR_META[k].description}</p>
            </li>
          ))}
        </ul>
      </section>

      {nameSearch && (
        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="text-sm font-semibold text-[#0E1916]">Was man findet, wenn man dich googelt</h2>
          <p className="text-xs text-[#9A9089] mt-0.5">
            Die ersten {nameSearch.total} Treffer bei der Suche nach deinem Namen – {nameSearch.aboutYou} davon handeln von dir.
            {nameSearch.knowledgePanel && " Google zeigt ein Knowledge Panel zu dir."}
          </p>
          <p className="text-xs text-[#9A9089] mt-1">
            {nameSearch.unambiguous
              ? "Google ordnet deinen Namen eindeutig dir zu – jeder Treffer mit deinem Namen zählt."
              : "Gibt es mehrere Personen mit deinem Namen, zählt ein Treffer nur, wenn auch deine Rolle, ein Thema oder deine Website passt. Trag deine Website in den Einstellungen ein, damit sie sicher erkannt wird."}
          </p>
          <ol className="mt-4 divide-y divide-[#F0EAE0]">
            {nameSearch.results.map((r, i) => (
              <li key={`${r.url}-${i}`} className="py-2 flex items-start gap-3 text-sm">
                <span className="w-6 shrink-0 tabular-nums text-[#9A9089]">{r.rank ?? i + 1}.</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${r.aboutYou ? "text-[#0E1916]" : "text-[#9A9089]"}`}>{r.title || r.domain}</span>
                  {r.domain && <span className="block truncate text-[11px] text-[#9A9089]">{r.domain}</span>}
                </span>
                {r.aboutYou && <span className="shrink-0 text-[11px] rounded-full bg-[#E3F1E8] text-[#1F6B3A] px-2 py-0.5">über dich</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {perTopic.length > 0 && (
        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="text-sm font-semibold text-[#0E1916]">Name + Thema</h2>
          <p className="text-xs text-[#9A9089] mt-0.5">Platz des ersten Treffers über dich, wenn jemand deinen Namen mit dem Thema sucht.</p>
          <ul className="mt-4 divide-y divide-[#F0EAE0]">
            {perTopic.map(t => (
              <li key={t.topic} className="py-2.5 flex justify-between gap-3 text-sm">
                <span className="text-[#0E1916]">{t.topic}</span>
                <span className={t.error ? "text-[#C8431F]" : "text-[#6B625A]"}>
                  {t.error ? "Abfrage fehlgeschlagen – zählt nicht mit" : t.position ? `Platz ${t.position}` : "nicht in den Top 10"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
