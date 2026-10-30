import type { HistoryPoint } from "@/lib/halo/score"

const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })

/** Kleiner Verlauf des Halo Scores (Skala 0–100). Ab zwei Punkten. */
export default function ScoreHistoryChart({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) return null
  const w = 320
  const h = 80
  const pad = 6
  const x = (i: number) => pad + (i / (history.length - 1)) * (w - pad * 2)
  const y = (s: number) => pad + (1 - s / 100) * (h - pad * 2)
  const points = history.map((p, i) => `${x(i)},${y(p.score)}`).join(" ")
  const last = history[history.length - 1]

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" role="img" aria-label={`Verlauf des Halo Scores, zuletzt ${last.score}`}>
        <line x1={pad} x2={w - pad} y1={y(50)} y2={y(50)} stroke="#F0EAE0" strokeDasharray="3 3" />
        <polyline points={points} fill="none" stroke="#FA5935" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {history.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.score)} r={i === history.length - 1 ? 3.5 : 2} fill="#FA5935">
            <title>{`${fmt(p.date)}: ${p.score}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="flex justify-between text-[11px] text-[#9A9089] mt-1">
        <span>{fmt(history[0].date)}</span>
        <span>{fmt(last.date)}</span>
      </figcaption>
    </figure>
  )
}
