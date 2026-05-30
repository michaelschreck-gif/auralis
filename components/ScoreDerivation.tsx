import type { ScoreDerivation } from "@/lib/auralis/master-scores"

/**
 * Zeigt die konkrete Herleitung eines Scores: pro Roh-Signal den gemessenen
 * Eingangswert, die Gewichtung und den resultierenden Beitrag. Die Summe der
 * Beiträge ergibt den angezeigten Score.
 *
 * Wird sowohl im ScoreExplainer (Modal, kompakt) als auch in der
 * ScoreDetailView (Seite, ausführlich) verwendet.
 */
export default function ScoreDerivationTable({
  derivation,
  compact = false,
}: {
  derivation: ScoreDerivation
  compact?: boolean
}) {
  const { factors, total } = derivation

  return (
    <div>
      {/* Formel-Kopfzeile */}
      <p className="text-xs text-[#64748b] mb-3 leading-relaxed">
        Jeder Score ist die Summe aus{" "}
        <span className="font-medium text-[#0f172a]">Messwert × Gewichtung</span>{" "}
        über alle Signale. Die Messwerte stammen aus deiner letzten Analyse.
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-100">
        {/* Header-Zeile */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-[#f8f9fb] text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
          <span>Signal</span>
          <span className="text-right w-14">Messwert</span>
          <span className="text-right w-12">Gewicht</span>
          <span className="text-right w-14">Beitrag</span>
        </div>

        <div className="divide-y divide-gray-100">
          {factors.map(f => (
            <div key={f.key} className="px-3 py-2.5">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: f.color }}
                  />
                  <span className="text-[#0f172a] truncate">{f.label}</span>
                </span>
                <span className="text-right w-14 tabular-nums text-[#0f172a] font-medium">
                  {f.rawValue}
                </span>
                <span className="text-right w-12 tabular-nums text-[#64748b]">
                  ×{f.weight.toFixed(2)}
                </span>
                <span className="text-right w-14 tabular-nums font-semibold text-[#0f172a]">
                  {f.contribution}
                </span>
              </div>
              {!compact && (
                <p className="text-xs text-[#94a3b8] mt-1.5 leading-snug pl-[18px]">
                  {f.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Summen-Zeile */}
        <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 bg-[#f8f9fb] border-t border-gray-100 items-baseline">
          <span className="text-xs font-semibold text-[#0f172a]">
            = Score (Summe der Beiträge)
          </span>
          <span className="text-right tabular-nums text-base font-semibold text-[#0f172a]">
            {total}<span className="text-xs text-[#94a3b8] font-normal">/100</span>
          </span>
        </div>
      </div>
    </div>
  )
}
