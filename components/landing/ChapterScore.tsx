"use client"

import { ease, seg, useScrollProgress } from "./hooks"
import { Chapter } from "./primitives"

// Gewichte wie lib/halo/score.ts; Werte sind ein Beispiel.
const PILLARS = [
  { key: "ai", label: "KI-Sichtbarkeit", weight: 50, value: 68, color: "#fa5935", d: "Wie oft und wie weit oben KI-Systeme dich nennen." },
  { key: "google", label: "Google-Sichtbarkeit", weight: 30, value: 81, color: "#8caaab", d: "Rankings, Knowledge Panel und Googles KI-Übersicht." },
  { key: "perception", label: "Wahrnehmung", weight: 20, value: 74, color: "#eae2d5", d: "Tonalität und Themenpassung, wenn du genannt wirst." },
]
const BANDS = [
  { label: "Nicht sichtbar", min: 0, max: 25 },
  { label: "Aufbauend", min: 26, max: 50 },
  { label: "Etabliert", min: 51, max: 75 },
  { label: "Dominant", min: 76, max: 100 },
]
const TOTAL = Math.round(PILLARS.reduce((s, x) => s + (x.weight / 100) * x.value, 0))

const R = 150
const C = 2 * Math.PI * R
const GAP = 10

// Skalenstriche, gerundet (gleiche Werte auf Server und Client)
const r2 = (n: number) => Math.round(n * 100) / 100
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const ang = (i / 60) * Math.PI * 2
  const a = 118
  const b = i % 5 === 0 ? 108 : 113
  return { x1: r2(200 + Math.cos(ang) * a), y1: r2(200 + Math.sin(ang) * a), x2: r2(200 + Math.cos(ang) * b), y2: r2(200 + Math.sin(ang) * b) }
})

// Bogen je Säule: Länge nach Gewicht, Start hinter dem vorherigen Bogen.
const ARCS = PILLARS.map((x, i) => {
  const before = PILLARS.slice(0, i).reduce((s, y) => s + (y.weight / 100) * C, 0)
  return { ...x, len: (x.weight / 100) * C - GAP, offset: before }
})

export function ChapterScore() {
  const [ref, p] = useScrollProgress<HTMLElement>("pin")
  const fill = ease(seg(p, 0.08, 0.62))
  const score = Math.round(TOTAL * fill)
  const band = BANDS.find(b => score >= b.min && score <= b.max) ?? BANDS[0]

  return (
    <section ref={ref} id="score" className="relative h-[280vh]" aria-label="Kapitel 4: Der Halo Score">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="lx-aura left-[10%] top-[25%] h-[34vw] w-[34vw] bg-[#fa5935]/15" />
        <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
          {/* Ring */}
          <div className="order-2 lg:order-1">
            <div className="relative mx-auto aspect-square w-full max-w-[min(520px,46svh)] lg:max-w-[min(540px,72svh)]">
              <svg viewBox="0 0 400 400" className="h-full w-full -rotate-90" role="img" aria-label={`Beispiel: Halo Score ${TOTAL} von 100`}>
                <defs>
                  <filter id="lx-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="6" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="200" cy="200" r="186" fill="none" stroke="rgba(234,226,213,.05)" strokeWidth="1" />
                {ARCS.map(a => (
                  <g key={a.key}>
                    <circle cx="200" cy="200" r={R} fill="none" stroke="rgba(234,226,213,.07)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${a.len} ${C}`} strokeDashoffset={-a.offset} />
                    <circle
                      cx="200"
                      cy="200"
                      r={R}
                      fill="none"
                      stroke={a.color}
                      strokeWidth="16"
                      strokeLinecap="round"
                      filter="url(#lx-glow)"
                      strokeOpacity={fill > 0.02 ? 1 : 0}
                      strokeDasharray={`${Math.max(0.01, a.len * (a.value / 100) * fill)} ${C}`}
                      strokeDashoffset={-a.offset}
                    />
                  </g>
                ))}
                {/* Skalenstriche */}
                {TICKS.map((t, i) => (
                  <line key={i} {...t} stroke="rgba(234,226,213,.14)" strokeWidth="1" />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--lx-muted)] sm:text-[11px]">Halo Score™</span>
                <span className="lx-display lx-num mt-1 text-[clamp(4.5rem,10vw,8.5rem)] !leading-none text-[var(--lx-text)]">{score}</span>
                <span className="mt-2 text-[13px] text-[var(--lx-peach)] sm:text-sm">{band.label}</span>
              </div>
            </div>
          </div>

          {/* Erklärung */}
          <div className="order-1 lg:order-2">
            <Chapter n="04" title="Der Halo Score" />
            <h2 className="lx-display mt-7 text-[clamp(2.1rem,4.4vw,4.2rem)]">
              Eine Zahl. <span className="lx-em">Drei Wahrheiten.</span>
            </h2>
            <ul className="mt-6 space-y-1 sm:mt-9">
              {PILLARS.map((x, i) => {
                const v = ease(seg(p, 0.12 + i * 0.12, 0.34 + i * 0.12))
                return (
                  <li key={x.key} className="border-t border-[var(--lx-line)] py-3 sm:py-4" style={{ opacity: 0.2 + v * 0.8, transform: `translateX(${(1 - v) * 18}px)` }}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full" style={{ background: x.color, boxShadow: `0 0 14px ${x.color}` }} />
                        <span className="font-medium text-[var(--lx-text)]">{x.label}</span>
                      </span>
                      <span className="lx-display lx-num text-2xl text-[var(--lx-text)]">{x.weight}&thinsp;%</span>
                    </div>
                    <p className="mt-1 hidden pl-5 text-sm text-[var(--lx-muted)] sm:block">{x.d}</p>
                  </li>
                )
              })}
            </ul>
            <p className="mt-5 max-w-[480px] border-l border-[var(--lx-coral)] pl-4 text-sm leading-relaxed text-[var(--lx-muted)]" style={{ opacity: seg(p, 0.5, 0.65) }}>
              <span className="text-[var(--lx-text)]">Ehrlich gerechnet:</span> Was noch nicht gemessen ist, zählt nicht als null – es zählt gar nicht.
              Sein Gewicht geht auf die gemessenen Säulen über.
            </p>
            {/* Bänder */}
            <div className="mt-7 hidden sm:block" style={{ opacity: seg(p, 0.55, 0.7) }}>
              <div className="grid grid-cols-4 gap-1.5">
                {BANDS.map(b => (
                  <div key={b.label}>
                    <div className={`h-1 rounded-full ${b === band ? "bg-[var(--lx-coral)]" : "bg-white/10"}`} />
                    <div className={`mt-2 text-[11px] ${b === band ? "text-[var(--lx-text)]" : "text-[var(--lx-dim)]"}`}>{b.label}</div>
                    <div className="lx-num text-[10px] text-[var(--lx-dim)]">
                      {b.min}–{b.max}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-6 text-[11px] text-[var(--lx-dim)]">Werte im Beispiel. Gewichte und Bänder wie im Tool.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
