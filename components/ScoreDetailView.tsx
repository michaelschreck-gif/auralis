import Link from "next/link"
import type { MasterScore, ScoreDefinition, ScoreDerivation } from "@/lib/auralis/master-scores"
import { DIMENSION_THEME } from "@/lib/auralis/theme"
import ScoreDerivationTable from "./ScoreDerivation"

const BAND_FILL = ["#FCEBEB", "#FAEEDA", "#E1F5EE", "#E6F1FB"]
const BAND_BORDER = ["#F09595", "#FAC775", "#9FE1CB", "#B5D4F4"]
const BAND_TEXT = ["#791F1F", "#854F0B", "#0F6E56", "#0C447C"]

export default function ScoreDetailView({
  score,
  definition,
  derivation,
}: {
  score: MasterScore
  definition: ScoreDefinition
  /** Konkrete Herleitung aus den Messwerten der letzten Analyse. */
  derivation?: ScoreDerivation | null
}) {
  const t = DIMENSION_THEME[score.key]
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#64748b]">
        <Link href="/dashboard" className="hover:text-[#0f172a] transition-colors">
          Cockpit
        </Link>
        <span className="mx-1.5 text-[#cbd5e1]">›</span>
        <span className="text-[#0f172a] font-medium">{definition.title}</span>
      </nav>

      {/* Hero — in der Dimensionsfarbe */}
      <div className="rounded-2xl p-5 md:p-6" style={{ background: t.bg }}>
        <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: t.label }}>
          Dein {definition.title}
        </p>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-5xl font-semibold tabular-nums" style={{ color: t.text }}>{score.value}</span>
          <span className="text-base" style={{ color: t.label }}>/100</span>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full ml-1"
            style={{ background: t.accent, color: "#fff" }}
          >
            {score.band.label}
          </span>
        </div>
        <div className="h-2 rounded-full mt-3 overflow-hidden max-w-md" style={{ background: t.track }}>
          <div className="h-2 rounded-full" style={{ width: `${score.value}%`, background: t.accent }} />
        </div>
        <p className="text-sm mt-3 leading-relaxed max-w-2xl" style={{ color: t.text }}>
          {definition.what}
        </p>
      </div>

      {/* Band Grid */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
          Score-Stufen
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {definition.bands.map((b, i) => {
            const active = i === score.bandIndex
            return (
              <div
                key={b.label}
                className={`rounded-xl p-4 border ${active ? "ring-2" : ""}`}
                style={{
                  background: BAND_FILL[i] ?? "#f3f4f6",
                  borderColor: active ? (BAND_BORDER[i] ?? "#cbd5e1") : "transparent",
                  // @ts-expect-error custom property
                  "--tw-ring-color": active ? (BAND_BORDER[i] ?? "#cbd5e1") : undefined,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: BAND_TEXT[i] ?? "#374151" }}>
                  {b.label}
                </p>
                <p className="text-xs mt-1 opacity-70" style={{ color: BAND_TEXT[i] ?? "#374151" }}>
                  Score {b.min}–{b.max}
                </p>
                {active && (
                  <p className="text-[10px] uppercase tracking-wider font-semibold mt-2" style={{ color: BAND_TEXT[i] ?? "#374151" }}>
                    ★ Du bist hier
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Score Breakdown — Gewichtungen */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
          Gewichtung der Signale
        </p>
        <div className="space-y-3">
          {definition.weights.map(w => (
            <div key={w.label} className="flex items-center gap-3 text-sm">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: w.color }} />
              <span className="flex-1 text-[#0f172a]">{w.label}</span>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${w.value}%`, background: w.color }} />
              </div>
              <span className="w-12 text-right text-[#64748b] tabular-nums">{w.value}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#94a3b8] mt-4">
          Gewichtungen zeigen den Anteil jedes Signals am {definition.title}.
        </p>
      </section>

      {/* So wird gerechnet — konkrete Messwerte dieses Users */}
      {derivation && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
            So wird dein {definition.title} gerechnet
          </p>
          <ScoreDerivationTable derivation={derivation} />
        </section>
      )}

      {/* Tips */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
          So optimierst du deinen {definition.title}
        </p>
        <div className="divide-y divide-gray-100">
          {definition.tips.map((t, i) => (
            <div key={i} className="flex items-start gap-3 py-3 text-sm leading-snug">
              <div className="w-6 h-6 rounded-full bg-[#EEEDFE] text-[#7F77DD] text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-[#0f172a]">{t}</span>
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/dashboard"
        className="inline-block text-sm text-[#7F77DD] hover:underline"
      >
        ← Zurück zum Cockpit
      </Link>
    </div>
  )
}
