import type { GapAnalysis } from "@/lib/auralis/gap-analysis"

/**
 * Zeigt pro Wettbewerber eine Lückenanalyse: bei welchen Frage-Archetypen
 * der Wettbewerber genannt wird und du nicht (Lücke) — und umgekehrt (Vorsprung).
 * Reine Anzeige-Komponente (server-renderbar).
 */
export default function GapAnalysisSection({ analyses }: { analyses: GapAnalysis[] }) {
  if (analyses.length === 0) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Lückenanalyse</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Bei welchen Arten von KI-Fragen ein Wettbewerber genannt wird — und du nicht. Das zeigt konkret, wo du inhaltlich aufholen kannst.
        </p>
      </div>

      {analyses.map(a => (
        <div key={a.competitorName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-medium text-[#0f172a]">
              Du vs. <span className="text-[#7F77DD]">{a.competitorName}</span>
            </p>
            <div className="flex items-center gap-2 text-xs">
              {a.gapCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 font-medium">
                  {a.gapCount} Lücke{a.gapCount === 1 ? "" : "n"}
                </span>
              )}
              {a.advantageCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">
                  {a.advantageCount} Vorsprung{a.advantageCount === 1 ? "" : "/-sprünge"}
                </span>
              )}
              {a.gapCount === 0 && a.advantageCount === 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-50 text-[#64748b] border border-gray-200">
                  gleichauf
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {a.comparisons.map(c => (
              <div key={c.type} className="px-6 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#0f172a]">{c.label}</p>
                  {c.hint && <p className="text-xs text-[#94a3b8] mt-0.5 truncate">{c.hint}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <MentionPill on={c.selfMentioned} who="Du" />
                  <MentionPill on={c.competitorMentioned} who={a.competitorName} />
                  <span className="w-24 text-right">
                    {c.verdict === "gap" && (
                      <span className="text-red-600 font-medium">→ Lücke</span>
                    )}
                    {c.verdict === "advantage" && (
                      <span className="text-green-600 font-medium">✓ Vorsprung</span>
                    )}
                    {c.verdict === "tie" && <span className="text-[#94a3b8]">gleich</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function MentionPill({ on, who }: { on: boolean; who: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-md border tabular-nums ${
        on
          ? "bg-green-50 text-green-700 border-green-100"
          : "bg-gray-50 text-[#94a3b8] border-gray-200"
      }`}
      title={`${who}: ${on ? "genannt" : "nicht genannt"}`}
    >
      {who.length > 10 ? who.slice(0, 10) + "…" : who} {on ? "✓" : "✗"}
    </span>
  )
}
