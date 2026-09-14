import Link from "next/link"
import type { MasterScore, ScoreDefinition, ScoreDerivation } from "@/lib/auralis/master-scores"
import { DIMENSION_THEME } from "@/lib/auralis/theme"
import ScoreDerivationTable from "./ScoreDerivation"

// Vier Stufen, Brandkit-konform: neutral → aufbauend → etabliert → Marke (Koralle).
const BAND_FILL   = ["#F1EEE7", "#F6ECD9", "#E9F0F0", "#FDE7E0"]
const BAND_BORDER = ["#D8D0C0", "#E7CFA3", "#C7D9D9", "#FBCBB8"]
const BAND_TEXT   = ["#5A5248", "#6B4A1E", "#1C2A2A", "#7A2A12"]

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
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#9A9089]">
        <Link href="/dashboard" className="hover:text-[#0E1916] transition-colors">
          Cockpit
        </Link>
        <span className="mx-1.5 text-[#D8CFC4]">›</span>
        <span className="text-[#0E1916] font-medium">{definition.title}</span>
      </nav>

      {/* Hero — Radial-Ring in der Dimensionsfarbe */}
      <div
        className="rounded-3xl p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8"
        style={{ background: t.bg }}
      >
        <svg
          width="112" height="112" viewBox="0 0 112 112"
          className="flex-shrink-0 mx-auto sm:mx-0"
          role="img" aria-label={`${definition.title} ${score.value} von 100`}
        >
          <circle cx="56" cy="56" r="44" fill="none" stroke={t.track} strokeWidth="11" />
          <circle
            cx="56" cy="56" r="44" fill="none" stroke={t.accent} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={`${(score.value / 100) * 276.5} 276.5`}
            transform="rotate(-90 56 56)"
          />
          <text x="56" y="54" textAnchor="middle" fill={t.text} fontSize="30" fontWeight="700" fontFamily="sans-serif">{score.value}</text>
          <text x="56" y="72" textAnchor="middle" fill={t.label} fontSize="11" fontFamily="sans-serif">/ 100</text>
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: t.label }}>
            Dein {definition.title}
          </p>
          <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight mt-1.5" style={{ color: t.text }}>
            {score.band.label}.
          </h1>
          <p className="text-sm mt-2.5 leading-relaxed max-w-2xl" style={{ color: t.text }}>
            {definition.what}
          </p>
        </div>
      </div>

      {/* Band Grid */}
      <section className="bg-white rounded-3xl border border-[#E9E1D3] p-6">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-4">
          Score-Stufen
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {definition.bands.map((b, i) => {
            const active = i === score.bandIndex
            return (
              <div
                key={b.label}
                className={`rounded-2xl p-4 border ${active ? "ring-2" : ""}`}
                style={{
                  background: BAND_FILL[i] ?? "#F3EFE6",
                  borderColor: active ? (BAND_BORDER[i] ?? "#E9E1D3") : "transparent",
                  // @ts-expect-error custom property
                  "--tw-ring-color": active ? (BAND_BORDER[i] ?? "#E9E1D3") : undefined,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: BAND_TEXT[i] ?? "#0E1916" }}>
                  {b.label}
                </p>
                <p className="text-xs mt-1 opacity-70" style={{ color: BAND_TEXT[i] ?? "#0E1916" }}>
                  Score {b.min}–{b.max}
                </p>
                {active && (
                  <p className="text-[10px] uppercase tracking-wider font-semibold mt-2" style={{ color: BAND_TEXT[i] ?? "#0E1916" }}>
                    ★ Du bist hier
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Score Breakdown — Gewichtungen */}
      <section className="bg-white rounded-3xl border border-[#E9E1D3] p-6">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-4">
          Gewichtung der Signale
        </p>
        <div className="space-y-3">
          {definition.weights.map(w => (
            <div key={w.label} className="flex items-center gap-3 text-sm">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: w.color }} />
              <span className="flex-1 text-[#0E1916]">{w.label}</span>
              <div className="w-32 h-2 bg-[#F3EFE6] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${w.value}%`, background: w.color }} />
              </div>
              <span className="w-12 text-right text-[#6B625A] tabular-nums">{w.value}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#9A9089] mt-4">
          Gewichtungen zeigen den Anteil jedes Signals am {definition.title}.
        </p>
      </section>

      {/* So wird gerechnet — konkrete Messwerte dieses Users */}
      {derivation && (
        <section className="bg-white rounded-3xl border border-[#E9E1D3] p-6">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-4">
            So wird dein {definition.title} gerechnet
          </p>
          <ScoreDerivationTable derivation={derivation} />
        </section>
      )}

      {/* Tips */}
      <section className="bg-white rounded-3xl border border-[#E9E1D3] p-6">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-4">
          So optimierst du deinen {definition.title}
        </p>
        <div className="divide-y divide-[#F0EAE0]">
          {definition.tips.map((t, i) => (
            <div key={i} className="flex items-start gap-3 py-3 text-sm leading-snug">
              <div className="w-6 h-6 rounded-full bg-[#FDE7E0] text-[#C8431F] text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-[#0E1916]">{t}</span>
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/dashboard"
        className="inline-block text-sm text-[#FA5935] hover:underline"
      >
        ← Zurück zum Cockpit
      </Link>
    </div>
  )
}
