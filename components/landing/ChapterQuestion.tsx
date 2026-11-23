"use client"

import { ease, seg, useScrollProgress } from "./hooks"
import { useT } from "./i18n"
import { Chapter } from "./primitives"

// Wann welcher Satz der Erzählung erscheint (Scroll-Fortschritt).
const STORY_FROM = [0, 0.2, 0.42, 0.72]

export function ChapterQuestion() {
  const t = useT()
  const q = t.question
  const PROMPT = q.prompt
  const INTRO = q.intro
  // Frei erfundene Beispielnamen – keine realen Personen.
  const NAMES = q.names
  const STORY = q.story.map((text, i) => ({ t: text, from: STORY_FROM[i], strong: i === q.story.length - 1 }))
  const [ref, p] = useScrollProgress<HTMLElement>("pin")

  const typed = Math.round(seg(p, 0.06, 0.24) * PROMPT.length)
  const thinking = p > 0.25 && p < 0.34
  const answer = seg(p, 0.34, 0.66)
  const introChars = Math.round(seg(answer, 0, 0.3) * INTRO.length)
  const scan = seg(p, 0.7, 0.86)
  const verdict = seg(p, 0.8, 0.9)
  const activeStory = STORY.reduce((acc, s, i) => (p >= s.from ? i : acc), 0)

  return (
    <section ref={ref} id="geschichte" className="relative h-[340vh]" aria-label={q.aria}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="lx-aura left-[30%] top-[20%] h-[40vw] w-[40vw] bg-[#fa5935]/10" />
        <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-6 px-5 sm:gap-10 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {/* Erzählung */}
          <div className="relative">
            <Chapter n="01" title={q.chapter} />
            <div className="relative mt-5 min-h-[6.5rem] sm:mt-8 sm:min-h-[12rem] lg:min-h-[15rem]">
              {STORY.map((s, i) => (
                <p
                  key={i}
                  className={`lx-display absolute inset-x-0 top-0 text-[clamp(1.55rem,3.8vw,3.6rem)] transition-all duration-700 ${
                    i === activeStory ? "translate-y-0 opacity-100 blur-0" : i < activeStory ? "-translate-y-6 opacity-0 blur-sm" : "translate-y-6 opacity-0 blur-sm"
                  } ${s.strong ? "text-[var(--lx-text)]" : "text-[var(--lx-text)]/90"}`}
                  style={{ transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" }}
                  aria-hidden={i !== activeStory}
                >
                  {s.strong ? (
                    <>
                      {q.storyLastPre}<span className="lx-em">{q.storyLastEm}</span>
                    </>
                  ) : (
                    s.t
                  )}
                </p>
              ))}
            </div>
            {/* Fortschritt der Szene */}
            <div className="mt-4 flex gap-2 sm:mt-8" aria-hidden="true">
              {STORY.map((_, i) => (
                <span key={i} className="h-[2px] w-10 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full bg-[var(--lx-coral)] transition-transform duration-500" style={{ transform: `scaleX(${i <= activeStory ? 1 : 0})`, transformOrigin: "left" }} />
                </span>
              ))}
            </div>
            {/* Für Screenreader die ganze Geschichte auf einmal */}
            <p className="sr-only">{STORY.map(s => s.t).join(" ")}</p>
          </div>

          {/* KI-Chat */}
          <div className="relative" aria-hidden="true">
            <div className="lx-glass relative overflow-hidden rounded-[24px] p-4 sm:rounded-[28px] sm:p-7">
              <div className="mb-4 flex items-center justify-between sm:mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#fa5935] to-[#f7b49b] text-[11px] font-bold text-white">{q.assistantBadge}</span>
                  <span className="text-[13px] font-medium text-[var(--lx-text)]">{q.assistant}</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--lx-dim)]">{q.example}</span>
              </div>

              {/* Frage */}
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-3 text-[14.5px] leading-relaxed text-[var(--lx-text)] sm:text-[15px]">
                  {PROMPT.slice(0, typed)}
                  {typed < PROMPT.length && <span className="lx-caret" />}
                  {typed === 0 && <span className="text-[var(--lx-dim)]">{q.placeholder}</span>}
                </div>
              </div>

              {/* Antwort */}
              <div className="relative mt-4 min-h-[214px] sm:mt-5 sm:min-h-[270px]">
                {thinking && (
                  <div className="lx-dots pt-2">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                {answer > 0 && (
                  <div className="text-[14.5px] leading-relaxed text-[var(--lx-muted)] sm:text-[15px]">
                    <p>{INTRO.slice(0, introChars)}</p>
                    <ol className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                      {NAMES.map((x, i) => {
                        const v = ease(seg(answer, 0.3 + i * 0.22, 0.52 + i * 0.22))
                        return (
                          <li
                            key={x.n}
                            className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-2 sm:px-4 sm:py-3"
                            style={{ opacity: v, transform: `translateY(${(1 - v) * 14}px)` }}
                          >
                            <span className="lx-display text-lg text-[var(--lx-peach)]">{i + 1}</span>
                            <span>
                              <span className="block font-medium text-[var(--lx-text)]">{x.n}</span>
                              <span className="hidden text-[13px] text-[var(--lx-dim)] sm:block">{x.d}</span>
                            </span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                )}
                {/* Suchlauf nach dem eigenen Namen */}
                {scan > 0 && scan < 1 && <div className="lx-scan" style={{ top: `${-30 + scan * 130}%` }} />}
              </div>

              {/* Urteil */}
              <div
                className="mt-3 flex items-center justify-between gap-4 rounded-2xl border sm:mt-5 border-[#fa5935]/40 bg-[#fa5935]/[0.08] px-4 py-3.5"
                style={{ opacity: verdict, transform: `translateY(${(1 - verdict) * 16}px) scale(${0.96 + verdict * 0.04})` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fa5935]/60 text-[var(--lx-coral)]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--lx-text)]">{q.yourName}</div>
                    <div className="text-[12px] text-[var(--lx-peach)]">{q.notFound}</div>
                  </div>
                </div>
                <span className="lx-num text-[12px] text-[var(--lx-dim)]">{q.count}</span>
              </div>
            </div>
            <p className="mt-4 hidden text-center text-[11px] text-[var(--lx-dim)] sm:block">{q.staged}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
