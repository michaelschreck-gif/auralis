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
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Lückenanalyse</span>
        <h2 className="font-[family-name:var(--font-display)] font-normal text-xl sm:text-2xl tracking-tight text-[#0E1916] mt-2">
          Wo du gegenüber Wettbewerbern aufholen kannst.
        </h2>
        <p className="text-sm text-[#6B625A] mt-2">
          Bei welchen Arten von KI-Fragen ein Wettbewerber genannt wird — und du nicht.
        </p>
      </div>

      {analyses.map(a => (
        <div key={a.competitorName} className="bg-white rounded-3xl border border-[#E9E1D3] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EAE0] flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-medium text-[#0E1916]">
              Du vs. <span className="text-[#FA5935]">{a.competitorName}</span>
            </p>
            <div className="flex items-center gap-2 text-xs">
              {a.gapCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#F6ECD9] text-[#6B4A1E] border border-[#E7CFA3] font-medium">
                  {a.gapCount} Lücke{a.gapCount === 1 ? "" : "n"}
                </span>
              )}
              {a.advantageCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FDE7E0] text-[#C8431F] border border-[#FBCBB8] font-medium">
                  {a.advantageCount} Vorsprung{a.advantageCount === 1 ? "" : "/-sprünge"}
                </span>
              )}
              {a.gapCount === 0 && a.advantageCount === 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#F3EFE6] text-[#6B625A] border border-[#E9E1D3]">
                  gleichauf
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-[#F0EAE0]">
            {a.comparisons.map(c => (
              <div key={c.type} className="px-6 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#0E1916]">{c.label}</p>
                  {c.hint && <p className="text-xs text-[#9A9089] mt-0.5 truncate">{c.hint}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <MentionPill on={c.selfMentioned} who="Du" />
                  <MentionPill on={c.competitorMentioned} who={a.competitorName} />
                  <span className="w-24 text-right">
                    {c.verdict === "gap" && (
                      <span className="text-[#8A5A0E] font-medium">→ Lücke</span>
                    )}
                    {c.verdict === "advantage" && (
                      <span className="text-[#C8431F] font-medium">✓ Vorsprung</span>
                    )}
                    {c.verdict === "tie" && <span className="text-[#9A9089]">gleich</span>}
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
          ? "bg-[#FDE7E0] text-[#C8431F] border-[#FBCBB8]"
          : "bg-[#F3EFE6] text-[#9A9089] border-[#E9E1D3]"
      }`}
      title={`${who}: ${on ? "genannt" : "nicht genannt"}`}
    >
      {who.length > 10 ? who.slice(0, 10) + "…" : who} {on ? "✓" : "✗"}
    </span>
  )
}
