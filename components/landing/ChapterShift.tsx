"use client"

import { seg, useScrollProgress } from "./hooks"
import { useT } from "./i18n"
import { Chapter, Reveal } from "./primitives"

export function ChapterShift() {
  const t = useT()
  const TEXT = t.shift.text
  // Wörter, die beim Aufleuchten in Markenfarbe erscheinen
  const ACCENT = new Set(t.shift.accent)
  const [ref, p] = useScrollProgress<HTMLElement>("pin")
  const words = TEXT.split(" ")
  const lit = seg(p, 0.05, 0.8) * words.length

  return (
    <section ref={ref} className="relative h-[240vh]" aria-label={t.shift.aria}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-8">
          <Chapter n="02" title={t.shift.chapter} />
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
            {t.shift.points.map(([title, d]) => (
              <div key={title}>
                <div className="font-medium text-[var(--lx-text)]">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lx-muted)]">{d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
