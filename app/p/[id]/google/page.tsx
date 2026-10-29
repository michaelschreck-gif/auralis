import { createHaloServerClient } from "@/lib/supabase/halo"
import { serpProvider, type SeoRunOutcome } from "@/lib/auralis/seo-providers"
import { SEO_FACTOR_META, type SeoFactorKey, type SeoSignals } from "@/lib/auralis/seo-score"
import { bandFor } from "@/lib/halo/score"
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
      text="Ob du bei deinen Themen in den Google-Treffern auftauchst, wie weit oben, ob es ein Knowledge Panel gibt und ob dich Googles KI-Übersicht nennt. Zählt mit 30 % in den Halo Score."
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
  const perTopic = ((latest.raw as unknown as SeoRunOutcome | null)?.perTopic ?? []) as SeoRunOutcome["perTopic"]
  const factors = (Object.keys(SEO_FACTOR_META) as SeoFactorKey[]).filter(k => typeof signals[k] === "number")

  return (
    <div className="max-w-4xl space-y-6">
      {header}
      <section className={`${card} p-6 flex items-center gap-6`}>
        <span className="text-5xl font-semibold tabular-nums text-[#0E1916]">{latest.score ?? "–"}</span>
        <div>
          {latest.score !== null && <span className="block text-lg font-semibold text-[#0E1916]">{bandFor(latest.score).label}</span>}
          <span className="block text-sm text-[#6B625A]">Gemessen am {formatDate(latest.created_at)}</span>
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

      {perTopic.length > 0 && (
        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="text-sm font-semibold text-[#0E1916]">Position je Thema</h2>
          <ul className="mt-4 divide-y divide-[#F0EAE0]">
            {perTopic.map(t => (
              <li key={t.topic} className="py-2.5 flex justify-between text-sm">
                <span className="text-[#0E1916]">{t.topic}</span>
                <span className="text-[#6B625A]">{t.position ? `Platz ${t.position}` : "nicht in den Top-Treffern"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
