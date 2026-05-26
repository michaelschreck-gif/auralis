import Link from "next/link"
import type { MasterScore, ScoreDefinition } from "@/lib/auralis/master-scores"

const BAND_FILL = ["#FCEBEB", "#FAEEDA", "#E1F5EE", "#E6F1FB"]
const BAND_BORDER = ["#F09595", "#FAC775", "#9FE1CB", "#B5D4F4"]
const BAND_TEXT = ["#791F1F", "#854F0B", "#0F6E56", "#0C447C"]

export default function ScoreDetailView({
  score,
  definition,
}: {
  score: MasterScore
  definition: ScoreDefinition
}) {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#64748b]">
        <Link href="/dashboard" className="hover:text-[#0f172a] transition-colors">
          Cockpit
        </Link>
        <span className="mx-1.5 text-[#cbd5e1]">›</span>
        <span className="text-[#0f172a] font-medium">{definition.title}</span>
      </nav>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
          Dein {definition.title}
        </p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-5xl font-semibold text-[#0f172a] tabular-nums">{score.value}</span>
          <span className="text-base text-[#94a3b8]">/100</span>
        </div>
        <p className="text-sm text-[#0f172a] mt-2 font-medium">
          {score.band.label}
        </p>
        <p className="text-sm text-[#64748b] mt-1 leading-relaxed">
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

      {/* Score Breakdown */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
          Score-Aufschlüsselung
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
          Gewichtungen zeigen den Anteil jedes Sub-Faktors am {definition.title}.
        </p>
      </section>

      {/* Tips */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
          So optimierst du deinen {definition.title}
        </p>
        <div className="divide-y divide-gray-100">
          {definition.tips.map((t, i) => (
            <div key={i} className="flex items-start gap-3 py-3 text-sm leading-snug">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-[#4F6EF7] text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-[#0f172a]">{t}</span>
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/dashboard"
        className="inline-block text-sm text-[#4F6EF7] hover:underline"
      >
        ← Zurück zum Cockpit
      </Link>
    </div>
  )
}
