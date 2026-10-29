import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadAnswers, loadLatestMeasurements, summarizeModels } from "@/lib/halo/details"
import { countSourceDomains, highlightName } from "@/lib/halo/text"
import { QUERY_TYPE_LABELS } from "@/lib/auralis/gap-analysis"
import MeasureNowButton from "@/components/halo/MeasureNowButton"
import { EmptyState, PageHeader, Score, Tabs, card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "KI-Sichtbarkeit · Halo" }

const TABS = [
  { id: "modelle", label: "Modelle" },
  { id: "themen", label: "Themen" },
  { id: "belege", label: "Belege" },
  { id: "quellen", label: "Quellen" },
]

export default async function KiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; thema?: string }>
}) {
  const { id } = await params
  const { tab: rawTab, thema } = await searchParams
  const tab = TABS.some(t => t.id === rawTab) ? (rawTab as string) : "modelle"

  const db = await createHaloServerClient()
  const [{ data: person }, latest, { data: topics }] = await Promise.all([
    db.from("persons").select("first_name, last_name").eq("id", id).single(),
    loadLatestMeasurements(db, id),
    db.from("topics").select("id").eq("person_id", id).eq("is_active", true),
  ])
  const topicIds = (topics ?? []).map(t => t.id)

  const header = (
    <PageHeader
      eyebrow="KI-Sichtbarkeit"
      title="Wie KI-Systeme dich nennen"
      text="Bei jeder Messung stellen wir ChatGPT, Claude und Gemini typische Fragen zu deinen Themen und prüfen, ob und wie weit oben du genannt wirst."
      action={<MeasureNowButton topicIds={topicIds} />}
    />
  )

  if (latest.length === 0) {
    return (
      <div className="max-w-5xl space-y-8">
        {header}
        <EmptyState title="Noch keine Messung" text="Starte eine Messung, dann erscheinen hier die Ergebnisse je Modell und Thema." />
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      {header}
      <Tabs base={`/p/${id}/ki`} current={tab} tabs={TABS} />

      {tab === "modelle" && <ModelsTab latest={latest} />}
      {tab === "themen" && <TopicsTab latest={latest} />}
      {tab === "belege" && person && (
        <EvidenceTab db={db} latest={latest} topicFilter={thema} base={`/p/${id}/ki?tab=belege`} firstName={person.first_name} lastName={person.last_name} />
      )}
      {tab === "quellen" && <SourcesTab db={db} latest={latest} />}
    </div>
  )
}

function ModelsTab({ latest }: { latest: Awaited<ReturnType<typeof loadLatestMeasurements>> }) {
  const models = summarizeModels(latest)
  return (
    <section className={`${card} overflow-hidden`}>
      <table className="w-full text-sm">
        <thead className="bg-[#FAF8F3] text-left text-xs text-[#6B625A]">
          <tr>
            <th className="px-5 py-3 font-medium">Modell</th>
            <th className="px-3 py-3 font-medium text-right">KI-Sichtbarkeit</th>
            <th className="px-3 py-3 font-medium text-right hidden sm:table-cell">genannt in</th>
            <th className="px-5 py-3 font-medium text-right hidden sm:table-cell">Ø Position</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EAE0]">
          {models.map(m => (
            <tr key={m.provider}>
              <td className="px-5 py-3">
                <span className="font-medium text-[#0E1916]">{m.label}</span>
                {m.error ? (
                  <span className="block text-xs text-[#C8431F] mt-0.5">Hat nicht geantwortet: {shortError(m.error)}</span>
                ) : m.topicsOk < m.topicsTotal ? (
                  <span className="block text-xs text-[#9A9089] mt-0.5">{m.topicsOk} von {m.topicsTotal} Themen</span>
                ) : null}
              </td>
              <td className="px-3 py-3 text-right"><Score value={m.ai} muted="nicht gemessen" /></td>
              <td className="px-3 py-3 text-right tabular-nums text-[#6B625A] hidden sm:table-cell">{m.mentionRate === null ? "–" : `${m.mentionRate} %`}</td>
              <td className="px-5 py-3 text-right tabular-nums text-[#6B625A] hidden sm:table-cell">{m.averagePosition === null ? "–" : `Platz ${m.averagePosition}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-5 py-3 text-xs text-[#9A9089] border-t border-[#F0EAE0]">
        „genannt in“ = Anteil der Antworten mit deinem Namen. Position = Platz in Aufzählungen, 1 ist ganz oben.
      </p>
    </section>
  )
}

function shortError(e: string): string {
  if (/quota|429/i.test(e)) return "Kontingent des Anbieters aufgebraucht."
  if (/credit|balance/i.test(e)) return "Guthaben beim Anbieter fehlt."
  if (/503|overload|high demand/i.test(e)) return "Anbieter überlastet."
  return "Fehler beim Anbieter."
}

function TopicsTab({ latest }: { latest: Awaited<ReturnType<typeof loadLatestMeasurements>> }) {
  return (
    <div className="space-y-4">
      {latest.map(m => {
        const intents = m.report?.intentStats ?? []
        return (
          <section key={m.id} className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium text-[#0E1916]">{m.topicName}</h2>
                <p className="text-xs text-[#9A9089] mt-0.5">
                  Gemessen am {formatDate(m.createdAt)} · {m.modelsOk} von {m.modelsTotal} Modellen
                  {m.report ? ` · genannt in ${m.report.mentionRate} % der Antworten` : ""}
                </p>
              </div>
              <Score value={m.aiScore} />
            </div>
            {intents.length > 0 && (
              <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {intents.map(s => (
                  <li key={s.type} className="flex items-center justify-between text-sm">
                    <span className="text-[#6B625A]">{QUERY_TYPE_LABELS[s.type] ?? s.type}</span>
                    <span className="tabular-nums text-[#0E1916]">
                      {s.mentioned} von {s.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
      <p className="text-xs text-[#9A9089]">Pro Fragetyp: in wie vielen Antworten du genannt wurdest.</p>
    </div>
  )
}

async function EvidenceTab({
  db,
  latest,
  topicFilter,
  base,
  firstName,
  lastName,
}: {
  db: Awaited<ReturnType<typeof createHaloServerClient>>
  latest: Awaited<ReturnType<typeof loadLatestMeasurements>>
  topicFilter?: string
  base: string
  firstName: string
  lastName: string
}) {
  const shown = topicFilter ? latest.filter(m => m.topicId === topicFilter) : latest
  const answers = await loadAnswers(db, shown.map(m => m.id))
  const byPrompt = new Map<string, typeof answers>()
  for (const a of answers) byPrompt.set(a.prompt, [...(byPrompt.get(a.prompt) ?? []), a])

  return (
    <div className="space-y-4">
      {latest.length > 1 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <a href={base} className={`rounded-full px-3 py-1 border ${!topicFilter ? "border-[#FA5935] text-[#0E1916]" : "border-[#E9E1D3] text-[#6B625A]"}`}>Alle Themen</a>
          {latest.map(m => (
            <a key={m.topicId} href={`${base}&thema=${m.topicId}`} className={`rounded-full px-3 py-1 border ${topicFilter === m.topicId ? "border-[#FA5935] text-[#0E1916]" : "border-[#E9E1D3] text-[#6B625A]"}`}>
              {m.topicName}
            </a>
          ))}
        </div>
      )}
      <p className="text-xs text-[#9A9089]">
        Die echten Antworten der letzten Messung. Dein Name ist hervorgehoben. Gefragt wurde jeweils, ohne deinen Namen zu nennen.
      </p>
      {[...byPrompt.entries()].map(([prompt, list]) => {
        const hits = list.filter(a => a.mentioned).length
        return (
          <details key={prompt} className={`${card} p-5 group`}>
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
              <div>
                <span className="block text-sm font-medium text-[#0E1916]">{prompt}</span>
                <span className="block text-xs text-[#9A9089] mt-0.5">
                  {QUERY_TYPE_LABELS[list[0].query_type ?? ""] ?? "Frage"} · genannt in {hits} von {list.length} Antworten
                </span>
              </div>
              <span className="text-[#9A9089] text-xs mt-0.5 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-4 space-y-4">
              {list.map(a => (
                <div key={a.id} className="rounded-xl bg-[#FAF8F3] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0E1916]">{a.model}</span>
                    <span className={a.mentioned ? "text-[#1F6B3A]" : "text-[#9A9089]"}>
                      {a.mentioned ? (a.position ? `genannt · Platz ${a.position}` : "genannt") : "nicht genannt"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#3A3632] whitespace-pre-line leading-relaxed">
                    {highlightName(a.response ?? "", firstName, lastName).map((s, i) =>
                      s.match ? (
                        <mark key={i} className="bg-[#FDE7E0] text-[#0E1916] rounded px-0.5">{s.text}</mark>
                      ) : (
                        <span key={i}>{s.text}</span>
                      ),
                    )}
                  </p>
                </div>
              ))}
            </div>
          </details>
        )
      })}
    </div>
  )
}

async function SourcesTab({
  db,
  latest,
}: {
  db: Awaited<ReturnType<typeof createHaloServerClient>>
  latest: Awaited<ReturnType<typeof loadLatestMeasurements>>
}) {
  const answers = await loadAnswers(db, latest.map(m => m.id))
  const sources = countSourceDomains(answers.map(a => a.response ?? ""))
  if (sources.length === 0) {
    return (
      <EmptyState
        title="Keine Quellen zitiert"
        text="In den letzten Antworten haben die KI-Modelle keine Links genannt. Quellen erscheinen vor allem bei Modellen mit Websuche (z. B. Perplexity)."
      />
    )
  }
  return (
    <section className={`${card} overflow-hidden`}>
      <table className="w-full text-sm">
        <thead className="bg-[#FAF8F3] text-left text-xs text-[#6B625A]">
          <tr>
            <th className="px-5 py-3 font-medium">Quelle</th>
            <th className="px-5 py-3 font-medium text-right">in Antworten</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EAE0]">
          {sources.slice(0, 30).map(s => (
            <tr key={s.domain}>
              <td className="px-5 py-2.5 text-[#0E1916]">{s.domain}</td>
              <td className="px-5 py-2.5 text-right tabular-nums text-[#6B625A]">{s.answers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
