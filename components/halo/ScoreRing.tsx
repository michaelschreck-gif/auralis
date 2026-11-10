import { CountUp } from "./motion"

type Pillar = { key: string; label: string; weight: number; value: number | null; measured: boolean }

const PILLAR_COLOR: Record<string, string> = { ai: "#FA5935", google: "#8CAAAB", perception: "#EAE2D5" }

const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * Halo Score als Ring (0–100). Zeichnet sich beim Erscheinen ruhig auf, die Zahl zählt hoch.
 * Mit `pillars`: ein Bogen je Säule, Länge nach Gewicht, gefüllt nach Wert (wie auf der Startseite).
 * Funktioniert hell (Admin/öffentliches Profil) und dunkel (Kundenbereich) über die --h-Variablen.
 */
export default function ScoreRing({
  score,
  size = 120,
  pillars,
  label,
}: {
  score: number
  size?: number
  pillars?: Pillar[]
  /** Text unter der Zahl, z. B. das Band. */
  label?: string
}) {
  const value = Math.max(0, Math.min(100, score))
  const large = size >= 150
  const R = 40
  const C = 2 * Math.PI * R
  const stroke = large ? 4.2 : 8

  const measured = (pillars ?? []).filter(p => p.measured)
  const totalWeight = measured.reduce((s, p) => s + p.weight, 0)
  const GAP = 3
  let offset = 0
  const arcs =
    measured.length > 1
      ? measured.map(p => {
          const len = (p.weight / totalWeight) * C
          const arc = { key: p.key, label: p.label, start: offset, len: Math.max(0.5, len - GAP), fill: Math.max(0.01, (len - GAP) * ((p.value ?? 0) / 100)) }
          offset += len
          return arc
        })
      : null

  const ticks = large
    ? Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2
        const o = 47.5
        const n = i % 4 === 0 ? 45.2 : 46.3
        return { x1: r2(50 + Math.cos(a) * o), y1: r2(50 + Math.sin(a) * o), x2: r2(50 + Math.cos(a) * n), y2: r2(50 + Math.sin(a) * n) }
      })
    : []

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`Halo Score ${value} von 100`}>
      {large && <div className="h-ring-aura" aria-hidden="true" />}
      <svg width={size} height={size} viewBox="0 0 100 100" className="relative -rotate-90" aria-hidden="true">
        {ticks.map((t, i) => (
          <line key={i} {...t} stroke="var(--h-line)" strokeWidth="0.35" />
        ))}
        {arcs ? (
          arcs.map((a, i) => (
            <g key={a.key} transform={`rotate(${r2((a.start / C) * 360)} 50 50)`}>
              <circle cx="50" cy="50" r={R} fill="none" stroke="var(--h-fill)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${r2(a.len)} ${r2(C)}`} />
              <circle
                className="h-draw"
                style={{ animationDelay: `${200 + i * 180}ms` }}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={PILLAR_COLOR[a.key] ?? "#FA5935"}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${r2(a.fill)} ${r2(C)}`}
              >
                <title>{a.label}</title>
              </circle>
            </g>
          ))
        ) : (
          <>
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--h-fill)" strokeWidth={stroke} />
            <circle
              className="h-draw"
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="#FA5935"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${r2((value / 100) * C)} ${r2(C)}`}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {large && <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[var(--h-muted)]">Halo Score™</span>}
        <CountUp
          value={value}
          style={{ fontSize: r2(size * (large ? 0.27 : 0.26)) }}
          className={`h-num tabular-nums leading-none text-[var(--h-text)] ${large ? "font-[family-name:var(--font-display)] font-light mt-1" : "font-semibold"}`}
        />
        {label && <span className="mt-1.5 text-[12px] text-[var(--h-link)]">{label}</span>}
      </div>
    </div>
  )
}
