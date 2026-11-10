"use client"

import { seg, useScrollProgress } from "./hooks"
import { Chapter, Reveal } from "./primitives"

const TEXT =
  "Früher entschied die erste Seite bei Google, wer gefunden wird. Heute entscheidet oft eine einzige Antwort. Sie nennt drei, vielleicht fünf Namen – und alle anderen existieren in diesem Moment nicht."
// Wörter, die beim Aufleuchten in Markenfarbe erscheinen
const ACCENT = new Set(["einzige", "Antwort.", "existieren", "nicht."])

export function ChapterShift() {
  const [ref, p] = useScrollProgress<HTMLElement>("pin")
  const words = TEXT.split(" ")
  const lit = seg(p, 0.05, 0.8) * words.length

  return (
    <section ref={ref} className="relative h-[240vh]" aria-label="Kapitel 2: Die Verschiebung">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-8">
          <Chapter n="02" title="Die Verschiebung" />
          <p className="lx-display lx-scrub mt-10 max-w-[1120px] text-[clamp(2rem,4.6vw,4.6rem)] !leading-[1.08]" aria-label={TEXT}>
            {words.map((w, i) => {
              const on = Math.max(0, Math.min(1, lit - i))
              const accent = ACCENT.has(w)
              return (
                <span key={i} aria-hidden="true" style={{ color: on > 0.5 ? (accent ? "var(--lx-coral)" : "var(--lx-text)") : "rgba(239,233,223,0.13)", fontStyle: accent ? "italic" : undefined }}>
                  {w}{" "}
                </span>
              )
            })}
          </p>
          <Reveal className="mt-14 grid max-w-[980px] gap-6 border-t border-[var(--lx-line)] pt-8 sm:grid-cols-3" delay={100}>
            {[
              ["Unsichtbar ist leise.", "Kein Ranking fällt, keine Warnung erscheint. Du fehlst einfach."],
              ["Jedes Modell sieht anders.", "Was ChatGPT über dich sagt, sagt Gemini noch lange nicht."],
              ["Es ändert sich ständig.", "Neue Modelle, neue Quellen – die Antworten verschieben sich Woche für Woche."],
            ].map(([t, d]) => (
              <div key={t}>
                <div className="font-medium text-[var(--lx-text)]">{t}</div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lx-muted)]">{d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
