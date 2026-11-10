import type { HistoryPoint } from "@/lib/halo/score"

const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * Verlauf des Halo Scores (Skala 0–100). Ab zwei Punkten.
 * Linie zeichnet sich beim Erscheinen auf, darunter eine weiche Fläche.
 */
export default function ScoreHistoryChart({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) return null
  const w = 400
  const h = 120
  const pad = 8
  const x = (i: number) => r2(pad + (i / (history.length - 1)) * (w - pad * 2))
  const y = (s: number) => r2(pad + (1 - s / 100) * (h - pad * 2))
  const line = history.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.score)}`).join(" ")
  const area = `${line} L${x(history.length - 1)},${h} L${x(0)},${h} Z`
  const last = history[history.length - 1]

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-28 overflow-visible" role="img" aria-label={`Verlauf des Halo Scores, zuletzt ${last.score}`}>
        <defs>
          <linearGradient id="h-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#FA5935" stopOpacity="0.28" />
            <stop offset="1" stopColor="#FA5935" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map(v => (
          <line key={v} x1={pad} x2={w - pad} y1={y(v)} y2={y(v)} stroke="var(--h-line-soft)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#h-trend-fill)" className="h-fade" />
        <path d={line} fill="none" stroke="#FA5935" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray="1 1" className="h-draw-line" />
      </svg>
      <figcaption className="flex justify-between text-[11px] text-[var(--h-dim)] mt-2">
        <span>{fmt(history[0].date)}</span>
        <span className="text-[var(--h-muted)]">
          {fmt(last.date)} · <span className="tabular-nums text-[var(--h-text)]">{last.score}</span>
        </span>
      </figcaption>
    </figure>
  )
}
