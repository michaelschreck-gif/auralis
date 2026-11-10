"use client"

import { ease, seg, useScrollProgress } from "./hooks"
import { Chapter, HaloMark } from "./primitives"

const r3 = (n: number) => Math.round(n * 1000) / 1000

const MODELS = ["Claude", "GPT-4o", "Perplexity", "Gemini", "Google"]

// Beispielfragen zum Beispielthema „KI-Strategie“ (die echte Fragen-Matrix ist ausführlicher).
const QUESTIONS = [
  "Wer prägt das Thema KI-Strategie?",
  "Wen empfiehlst du für eine Keynote zu KI-Strategie?",
  "Welche Expert:innen für KI-Strategie kennst du?",
  "Wer ist im DACH-Raum bekannt für KI-Strategie?",
  "Welche Stimmen zu KI-Strategie lohnen sich?",
  "Mit wem verbindet man KI-Strategie?",
  "Wer berät Unternehmen zu KI-Strategie?",
]

// Bewusst ohne Zahlen: was die Messung ausmacht, nicht wie oft.
const STATS: { l: string; d: string; icon: "ask" | "rounds" | "models" | "weekly" }[] = [
  { l: "Die richtigen Fragen je Thema", d: "so, wie echte Menschen fragen", icon: "ask" },
  { l: "Mehrere Runden je Modell", d: "damit Zufall nicht zählt", icon: "rounds" },
  { l: "Über mehrere KI-Modelle hinweg", d: "plus Google-Suche & KI-Übersicht", icon: "models" },
  { l: "Wöchentliche Status-Abfragen", d: "du siehst, was sich bewegt", icon: "weekly" },
]

function StatIcon({ name }: { name: (typeof STATS)[number]["icon"] }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {name === "ask" && (
        <>
          <path {...common} d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" />
          <path {...common} d="M9.8 7.8a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.4v.3" />
          <circle cx="12" cy="13.6" r=".6" fill="currentColor" />
        </>
      )}
      {name === "rounds" && (
        <>
          <path {...common} d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3" />
          <path {...common} d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3" />
          <path {...common} d="M17.6 3.5v3.4h-3.4M6.4 20.5v-3.4h3.4" />
        </>
      )}
      {name === "models" && (
        <>
          <circle {...common} cx="12" cy="5.5" r="2.5" />
          <circle {...common} cx="5.5" cy="17.5" r="2.5" />
          <circle {...common} cx="18.5" cy="17.5" r="2.5" />
          <path {...common} d="M10.8 7.7 6.8 15.3M13.2 7.7l4 7.6M8 17.5h8" />
        </>
      )}
      {name === "weekly" && (
        <>
          <rect {...common} x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path {...common} d="M3.5 9.5h17M8 3v4M16 3v4" />
          <path {...common} d="m9 14.6 2 2 4-4" />
        </>
      )}
    </svg>
  )
}

export function ChapterMeasure() {
  const [ref, p] = useScrollProgress<HTMLElement>("pin")
  const spin = p * Math.PI * 1.6
  const statsOn = seg(p, 0.05, 0.45)

  return (
    <section ref={ref} id="messung" className="relative h-[300vh]" aria-label="Kapitel 3: Die Messung">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="lx-aura right-[5%] top-[15%] h-[38vw] w-[38vw] bg-[#8caaab]/15" />
        <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-6 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Chapter n="03" title="Die Messung" />
            <h2 className="lx-display mt-5 text-[clamp(1.9rem,4.4vw,4.2rem)] sm:mt-7">
              Wir stellen die Fragen, <span className="lx-em">die über dich entscheiden.</span>
            </h2>
            <p className="lx-lead mt-6 hidden max-w-[500px] sm:block">
              DigitalHalo fragt die wichtigsten KI-Modelle so, wie Kund:innen, Veranstalter und Journalist:innen fragen –
              Woche für Woche. Dann wertet Halo aus: Wirst du genannt? An welcher Stelle? In welchem Ton?
            </p>
            <ul className="mt-6 grid max-w-[540px] grid-cols-2 gap-x-4 gap-y-4 sm:mt-10 sm:gap-x-6 sm:gap-y-6">
              {STATS.map((s, i) => {
                const v = ease(seg(statsOn, i * 0.15, 0.5 + i * 0.15))
                return (
                  <li key={s.l} className="border-t border-[var(--lx-line)] pt-3 sm:pt-4" style={{ opacity: 0.25 + v * 0.75, transform: `translateY(${(1 - v) * 10}px)` }}>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full border sm:h-11 sm:w-11"
                      style={{ borderColor: v > 0.6 ? "rgba(250,89,53,.55)" : "rgba(234,226,213,.15)", color: v > 0.6 ? "#f7b49b" : "#9aa6a2", boxShadow: v > 0.6 ? "0 0 22px rgba(250,89,53,.25)" : "none", transition: "all .6s ease" }}
                    >
                      <StatIcon name={s.icon} />
                    </span>
                    <span className="mt-3 block text-[13px] font-medium leading-snug text-[var(--lx-text)] sm:text-[15px]">{s.l}</span>
                    <span className="mt-0.5 hidden text-[12.5px] text-[var(--lx-dim)] sm:block">{s.d}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Orbit */}
          <div className="relative mx-auto aspect-square w-full max-w-[min(620px,46svh)] lg:max-w-[min(640px,80svh)]" aria-hidden="true">
            {/* Umlaufbahnen */}
            <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="lx-orbit" x1="0" x2="1">
                  <stop offset="0" stopColor="#fa5935" stopOpacity="0" />
                  <stop offset=".5" stopColor="#f7b49b" stopOpacity=".55" />
                  <stop offset="1" stopColor="#8caaab" stopOpacity="0" />
                </linearGradient>
              </defs>
              <ellipse cx="300" cy="300" rx="270" ry="96" fill="none" stroke="url(#lx-orbit)" strokeWidth="1" transform="rotate(-14 300 300)" />
              <ellipse cx="300" cy="300" rx="200" ry="200" fill="none" stroke="rgba(234,226,213,.07)" strokeWidth="1" strokeDasharray="2 7" />
              <ellipse cx="300" cy="300" rx="290" ry="290" fill="none" stroke="rgba(234,226,213,.04)" strokeWidth="1" />
            </svg>

            {/* Fragen fliegen ins Zentrum */}
            {QUESTIONS.map((q, i) => {
              const start = 0.08 + i * 0.085
              const t = seg(p, start, start + 0.22)
              if (t <= 0 || t >= 1) return null
              const a = (i / QUESTIONS.length) * Math.PI * 2 + 0.6
              const r = 50 * (1 - ease(t))
              const x = 50 + Math.cos(a) * r
              const y = 50 + Math.sin(a) * r * 0.9
              const o = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1
              return (
                <div
                  key={q}
                  className="absolute whitespace-nowrap rounded-full border border-white/10 bg-[#0b1312]/80 px-3.5 py-1.5 text-[11.5px] text-[var(--lx-muted)] backdrop-blur-md sm:text-[12.5px]"
                  style={{ left: `${r3(x)}%`, top: `${r3(y)}%`, transform: `translate(-50%,-50%) scale(${r3(1 - ease(t) * 0.45)})`, opacity: r3(o) }}
                >
                  {q}
                </div>
              )
            })}

            {/* Zentrum */}
            <div className="absolute left-1/2 top-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2" style={{ filter: `brightness(${0.75 + seg(p, 0.1, 0.9) * 0.5})` }}>
              <HaloMark className="w-full" />
            </div>

            {/* Modelle auf der Umlaufbahn */}
            {MODELS.map((m, i) => {
              const a = spin + (i / MODELS.length) * Math.PI * 2
              const ex = Math.cos(a) * 45
              const ey = Math.sin(a) * 16
              // Ellipse leicht gekippt (-14°)
              const rot = (-14 * Math.PI) / 180
              const x = 50 + ex * Math.cos(rot) - ey * Math.sin(rot)
              const y = 50 + ex * Math.sin(rot) + ey * Math.cos(rot)
              const front = Math.sin(a) > 0
              const depth = r3((Math.sin(a) + 1) / 2)
              return (
                <div
                  key={m}
                  className="absolute flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium backdrop-blur-md sm:text-[13px]"
                  style={{
                    left: `${r3(x)}%`,
                    top: `${r3(y)}%`,
                    transform: `translate(-50%,-50%) scale(${r3(0.78 + depth * 0.32)})`,
                    zIndex: front ? 20 : 5,
                    opacity: r3(0.45 + depth * 0.55),
                    borderColor: front ? "rgba(247,180,155,.35)" : "rgba(234,226,213,.1)",
                    background: front ? "rgba(250,89,53,.12)" : "rgba(11,19,18,.7)",
                    color: front ? "#efe9df" : "#9aa6a2",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: front ? "#fa5935" : "#8caaab" }} />
                  {m}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
