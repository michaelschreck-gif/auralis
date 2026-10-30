import Link from "next/link"
import { requireAdminPage } from "@/lib/halo/admin"
import { evaluateGold, type Detector, type GoldItem, type MismatchKind } from "@/lib/halo/gold"
import { extractMentionSignal } from "@/lib/auralis/analyzer"
import { stripMarkdown } from "@/lib/halo/text"
import { addGoldSample } from "./actions"
import AdminButton from "@/components/halo/admin/AdminButton"
import GoldLabelForm from "@/components/halo/admin/GoldLabelForm"
import { card } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Prüfset · Admin · Halo" }

/** Die Erkennung, die auch beim Messen läuft (lib/auralis/analyzer.ts). */
const detect: Detector = (response, targetName, prompt) => {
  const s = extractMentionSignal(response, targetName, "gold", 1, prompt, "gold").signal
  return { mentioned: s.mentioned, position: s.position, sentiment: s.sentiment }
}

const KIND_LABEL: Record<MismatchKind, string> = {
  false_positive: "Fälschlich erkannt",
  false_negative: "Übersehen",
  position: "Platz falsch",
  sentiment: "Tonalität falsch",
}

const SENT_LABEL = { positive: "Positiv", neutral: "Neutral", negative: "Negativ" } as const

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)} %`)

function Metric({ label, value, hint, warn = false }: { label: string; value: string; hint: string; warn?: boolean }) {
  return (
    <div className={`${card} p-4 ${warn ? "border-[#F2C6B8] bg-[#FFF6F2]" : ""}`}>
      <span className="text-xs text-[#6B625A]">{label}</span>
      <span className={`block text-2xl font-semibold tabular-nums mt-1 ${warn ? "text-[#C8431F]" : "text-[#0E1916]"}`}>{value}</span>
      <span className="block text-[11px] text-[#9A9089] mt-0.5">{hint}</span>
    </div>
  )
}

export default async function PruefsetPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { service: db } = await requireAdminPage()
  const { id: requestedId } = await searchParams

  const [{ count: total }, { count: open }, { count: excluded }, { data: labeled }] = await Promise.all([
    db.from("gold_answers").select("id", { count: "exact", head: true }),
    db.from("gold_answers").select("id", { count: "exact", head: true }).is("labeled_at", null).eq("excluded", false),
    db.from("gold_answers").select("id", { count: "exact", head: true }).eq("excluded", true),
    db
      .from("gold_answers")
      .select("id, target_name, prompt, response, label_mentioned, label_position, label_sentiment")
      .not("labeled_at", "is", null)
      .eq("excluded", false)
      .limit(2000),
  ])

  // Zu bewertende Antwort: gewünschte ?id=, sonst die älteste offene.
  const currentQuery = db.from("gold_answers").select("*")
  const { data: currentRows } = requestedId
    ? await currentQuery.eq("id", requestedId).limit(1)
    : await currentQuery.is("labeled_at", null).eq("excluded", false).order("created_at", { ascending: true }).limit(1)
  const current = currentRows?.[0] ?? null

  const items: GoldItem[] = (labeled ?? []).map(r => ({
    id: r.id,
    targetName: r.target_name,
    prompt: r.prompt,
    response: r.response,
    labelMentioned: r.label_mentioned ?? false,
    labelPosition: r.label_position,
    labelSentiment: r.label_sentiment,
  }))
  const ev = evaluateGold(items, detect)
  const nameById = new Map(items.map(i => [i.id, i.targetName]))
  const doneCount = items.length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Prüfset</h1>
        <p className="text-sm text-[#6B625A] mt-2 max-w-2xl">
          Echte KI-Antworten, von Hand bewertet. Die Auswertung vergleicht sie mit der automatischen Erkennung, die beim Messen läuft –
          so sehen wir, wie genau Nennung, Platz und Tonalität erkannt werden. Ziel: mindestens 100 bewertete Antworten.
        </p>
      </div>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-[#0E1916]"><span className="font-semibold tabular-nums">{doneCount}</span> bewertet</span>
        <span className="text-[#6B625A]"><span className="tabular-nums">{open ?? 0}</span> offen</span>
        <span className="text-[#6B625A]"><span className="tabular-nums">{excluded ?? 0}</span> aussortiert</span>
        <span className="text-[#9A9089]">{total ?? 0} im Prüfset</span>
        <AdminButton action={addGoldSample.bind(null, 20)} label="20 Antworten aus Messungen aufnehmen" />
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">{requestedId ? "Bewertung ansehen / ändern" : "Nächste Antwort bewerten"}</h2>
        {!current ? (
          <p className="text-sm text-[#6B625A] mt-3">Keine offene Antwort. Nimm weitere Antworten aus den Messungen auf.</p>
        ) : (
          <div className="mt-4 grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-3 min-w-0">
              <div className="text-xs text-[#6B625A]">
                Gesucht: <span className="text-sm font-semibold text-[#0E1916]">{current.target_name}</span>
                {current.topic && <> · Thema {current.topic}</>}
                {current.model && <> · {current.model}</>}
              </div>
              <div className="rounded-lg bg-[#FAF8F3] px-3 py-2 text-sm text-[#3A3632]">
                <span className="block text-[11px] uppercase tracking-wide text-[#9A9089]">Frage</span>
                {current.prompt}
              </div>
              <div className="rounded-lg border border-[#F0EAE0] px-3 py-2 text-sm text-[#0E1916] whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed">
                {stripMarkdown(current.response)}
              </div>
            </div>
            <div className="lg:sticky lg:top-4 self-start">
              <GoldLabelForm
                key={current.id}
                id={current.id}
                initial={{
                  mentioned: current.label_mentioned,
                  position: current.label_position,
                  sentiment: current.label_sentiment,
                  note: current.label_note ?? "",
                }}
              />
              <p className="text-[11px] text-[#9A9089] mt-4">
                Gezählt wird nur die gesuchte Person, nicht ein Namensvetter. Nur der Nachname reicht, wenn eindeutig sie gemeint ist.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#0E1916]">Auswertung der automatischen Erkennung ({doneCount} Antworten)</h2>
        {doneCount === 0 ? (
          <p className="text-sm text-[#6B625A]">Sobald Antworten bewertet sind, steht hier, wie genau die Erkennung arbeitet.</p>
        ) : (
          <>
            {doneCount < 100 && (
              <p className="text-xs text-[#9A9089]">Noch unter 100 Antworten – die Quoten schwanken noch stark.</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Metric
                label="Nennung: Trefferquote"
                value={pct(ev.mention.precision)}
                hint={`${ev.mention.falsePositive} fälschlich erkannt`}
                warn={ev.mention.precision !== null && ev.mention.precision < 0.95}
              />
              <Metric
                label="Nennung: Vollständigkeit"
                value={pct(ev.mention.recall)}
                hint={`${ev.mention.falseNegative} übersehen`}
                warn={ev.mention.recall !== null && ev.mention.recall < 0.9}
              />
              <Metric
                label="Platz: höchstens 1 daneben"
                value={pct(ev.position.compared ? ev.position.withinOne / ev.position.compared : null)}
                hint={`exakt ${ev.position.exact} von ${ev.position.compared} · Ø ${ev.position.meanAbsError ?? "–"} Plätze daneben`}
                warn={ev.position.compared > 0 && ev.position.withinOne / ev.position.compared < 0.8}
              />
              <Metric
                label="Tonalität: Übereinstimmung"
                value={pct(ev.sentiment.compared ? ev.sentiment.agree / ev.sentiment.compared : null)}
                hint={`${ev.sentiment.agree} von ${ev.sentiment.compared}`}
                warn={ev.sentiment.compared > 0 && ev.sentiment.agree / ev.sentiment.compared < 0.7}
              />
            </div>

            {ev.sentiment.compared > 0 && (
              <div className={`${card} p-5 overflow-x-auto`}>
                <h3 className="text-sm font-medium text-[#0E1916]">Tonalität: bewertet (Zeile) vs. erkannt (Spalte)</h3>
                <table className="mt-3 text-sm">
                  <thead>
                    <tr className="text-xs text-[#9A9089]">
                      <th className="pr-4 text-left font-normal" />
                      {(["positive", "neutral", "negative"] as const).map(d => <th key={d} className="px-3 font-normal">{SENT_LABEL[d]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(["positive", "neutral", "negative"] as const).map(e => (
                      <tr key={e}>
                        <td className="pr-4 py-1 text-[#6B625A]">{SENT_LABEL[e]}</td>
                        {(["positive", "neutral", "negative"] as const).map(d => (
                          <td key={d} className={`px-3 py-1 text-center tabular-nums ${e === d ? "font-semibold text-[#1F6B3A]" : ev.sentiment.confusion[e][d] ? "text-[#C8431F]" : "text-[#9A9089]"}`}>
                            {ev.sentiment.confusion[e][d]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {ev.mismatches.length > 0 && (
              <div className={`${card} p-5`}>
                <h3 className="text-sm font-medium text-[#0E1916]">Abweichungen ({ev.mismatches.length})</h3>
                <ul className="mt-3 divide-y divide-[#F0EAE0] text-sm">
                  {ev.mismatches.slice(0, 100).map((m, i) => (
                    <li key={`${m.id}-${m.kind}-${i}`} className="py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <span className="w-40 shrink-0 text-[#C8431F]">{KIND_LABEL[m.kind]}</span>
                      <span className="flex-1 text-[#3A3632]">
                        {nameById.get(m.id)} · bewertet: {m.kind === "sentiment" ? SENT_LABEL[m.expected as keyof typeof SENT_LABEL] : m.expected} · erkannt:{" "}
                        {m.kind === "sentiment" ? SENT_LABEL[m.detected as keyof typeof SENT_LABEL] : m.detected}
                      </span>
                      <Link href={`/admin/pruefset?id=${m.id}`} className="text-xs text-[#C8431F] hover:underline shrink-0">Antwort ansehen</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
