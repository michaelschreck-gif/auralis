import Link from "next/link"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadImpulses } from "@/lib/halo/details"
import { personDisplayName } from "@/lib/halo/measure"
import { PATTERN_LABELS } from "@/lib/halo/impulses"
import { EmptyState, PageHeader, Score, card } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Impulse · Halo" }

export default async function ImpulsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const { data: person } = await db.from("persons").select("first_name, last_name").eq("id", id).single()
  const view = person ? await loadImpulses(db, id, personDisplayName(person)) : null
  const ownByTopic = new Map((view?.own ?? []).map(o => [o.topic, o.ai]))

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Impulse"
        title="Wen die KI zu deinen Themen nennt"
        text="Personen, die in den KI-Antworten zu deinen Themen stark vertreten sind – und was sie sichtbar macht. Der Score ist so berechnet wie deine KI-Sichtbarkeit: wie oft und wie weit vorne jemand genannt wird."
      />

      {!view ? (
        <EmptyState title="Noch keine Messung" text="Impulse entstehen aus den KI-Antworten deiner Messungen. Miss zuerst deine Themen." />
      ) : view.people.length === 0 ? (
        <EmptyState
          title="Noch keine wiederkehrenden Namen"
          text={`In ${view.answersAnalyzed} KI-Antworten wurde niemand mehrfach genannt. Mit weiteren Messungen entsteht hier ein Bild.`}
        />
      ) : (
        <>
          {view.patterns.length > 0 && (
            <section className={`${card} p-5 sm:p-6`}>
              <h2 className="text-sm font-semibold text-[#0E1916]">Was diese Personen sichtbar macht</h2>
              <p className="text-xs text-[#9A9089] mt-0.5">So beschreiben die KI-Antworten die genannten Personen.</p>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                {view.patterns.slice(0, 6).map(p => (
                  <li key={p.key} className="rounded-lg bg-[#FAF8F3] px-3 py-2">
                    <span className="text-sm font-medium text-[#0E1916]">{p.label}</span>
                    <span className="ml-2 text-xs text-[#6B625A]">bei {p.people} {p.people === 1 ? "Person" : "Personen"}</span>
                    <span className="block text-xs text-[#6B625A] mt-0.5">{p.hint}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={`${card} p-5 sm:p-6`}>
            <h2 className="text-sm font-semibold text-[#0E1916]">Stark genannt zu deinen Themen</h2>
            <p className="text-xs text-[#9A9089] mt-0.5">
              Aus {view.answersAnalyzed} KI-Antworten deiner jüngsten Messungen. Aufgenommen wird, wer in mindestens 10 % der Antworten zu einem Thema genannt wird.
            </p>
            <ol className="mt-4 divide-y divide-[#F0EAE0]">
              {view.people.map((p, i) => (
                <li key={p.name} className="py-4 flex gap-3">
                  <span className="w-6 shrink-0 text-sm tabular-nums text-[#9A9089] pt-0.5">{i + 1}.</span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-sm font-medium text-[#0E1916]">{p.name}</span>
                        <span className="block text-[11px] text-[#9A9089]">
                          {p.mentions} {p.mentions === 1 ? "Nennung" : "Nennungen"}
                          {p.patterns.length > 0 && ` · ${p.patterns.map(k => PATTERN_LABELS[k].label).join(", ")}`}
                        </span>
                      </div>
                      <span className="text-right"><Score value={p.score} /></span>
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {p.topics.map(t => {
                        const own = ownByTopic.get(t.topic)
                        return (
                          <li
                            key={t.topic}
                            className="rounded-full bg-[#FAF8F3] border border-[#F0EAE0] px-2.5 py-1 text-[11px] text-[#3A3632]"
                            title={`${t.mentions} von ${t.answers} Antworten, Ø Platz ${t.averagePosition.toLocaleString("de-DE")}`}
                          >
                            {t.topic}: <span className="font-semibold tabular-nums">{t.score}</span>
                            {own !== undefined && own !== null && <span className="text-[#9A9089]"> · du {own}</span>}
                          </li>
                        )
                      })}
                    </ul>
                    {p.contexts[0] && <p className="text-xs text-[#6B625A] leading-relaxed">„{p.contexts[0]}“</p>}
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-[#9A9089] mt-4">
              Die vollständigen Antworten findest du unter{" "}
              <Link href={`/p/${id}/ki?tab=belege`} className="text-[#C8431F] hover:underline">KI-Sichtbarkeit → Belege</Link>.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
