"use client"

import { type ReactNode } from "react"
import { useInView } from "./hooks"
import { useT } from "./i18n"
import { Chapter, Reveal, SplitHeading, onSpotMove } from "./primitives"

function Tile({ className = "", tag, title, text, children, delay = 0 }: {
  className?: string
  tag?: string
  title: string
  text: string
  children: ReactNode
  delay?: number
}) {
  return (
    <Reveal delay={delay} className={className}>
      <article onMouseMove={onSpotMove} className="lx-spot lx-glass group flex h-full flex-col rounded-[26px] p-6 sm:p-7">
        <div className="mb-6 min-h-[150px] flex-1">{children}</div>
        <div className="flex items-center gap-3">
          <h3 className="text-[17px] font-medium text-[var(--lx-text)]">{title}</h3>
          {tag && <span className="rounded-full border border-[var(--lx-line-strong)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--lx-peach)]">{tag}</span>}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--lx-muted)]">{text}</p>
      </article>
    </Reveal>
  )
}

function ImpulseVisual() {
  const f = useT().features.impulse
  const items = f.items.map((t, i) => ({ t, n: [4, 3, 2][i] }))
  return (
    <div className="space-y-2.5" aria-hidden="true">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--lx-dim)]">{f.head}</div>
      {items.map((x, i) => (
        <div key={x.t} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 transition-transform duration-500 group-hover:translate-x-1" style={{ transitionDelay: `${i * 60}ms` }}>
          <span className="text-[13px] text-[var(--lx-text)]">{x.t}</span>
          <span className="flex items-center gap-1">
            {Array.from({ length: x.n }).map((_, k) => (
              <span key={k} className="h-5 w-5 rounded-full border border-[#0b1312] bg-gradient-to-br from-[#8caaab] to-[#2d4a4b]" style={{ marginLeft: k ? -8 : 0 }} />
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

function ActionsVisual() {
  const [ref, on] = useInView<HTMLDivElement>({ threshold: 0.5 })
  const a = useT().features.actions
  const items = a.items
  return (
    <div ref={ref} className="space-y-2.5" aria-hidden="true">
      {items.map((t, i) => (
        <div key={t} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-500"
            style={{ transitionDelay: `${600 + i * 450}ms`, background: on && i < 2 ? "#fa5935" : "transparent", borderColor: on && i < 2 ? "#fa5935" : "rgba(234,226,213,.25)" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: on && i < 2 ? 1 : 0, transition: `opacity .4s ${700 + i * 450}ms` }}>
              <path d="M2 5.2l2 2L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className={`text-[13px] transition-colors duration-500 ${on && i < 2 ? "text-[var(--lx-dim)] line-through" : "text-[var(--lx-text)]"}`} style={{ transitionDelay: `${600 + i * 450}ms` }}>
            {t}
          </span>
          <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-[var(--lx-peach)]">{a.impacts[i]}</span>
        </div>
      ))}
    </div>
  )
}

function VoiceVisual() {
  const quote = useT().features.voice.quote
  const bars = [10, 22, 36, 18, 44, 28, 52, 30, 40, 16, 34, 48, 24, 38, 14, 30, 46, 20, 34, 12]
  return (
    <div className="flex h-full min-h-[150px] flex-col items-center justify-center" aria-hidden="true">
      <div className="lx-wave flex h-16 items-center gap-[5px]">
        {bars.map((h, i) => (
          <span key={i} style={{ height: h, animationDelay: `${(i % 7) * 0.11}s` }} />
        ))}
      </div>
      <p className="lx-display mt-5 text-center text-lg italic text-[var(--lx-text)]/85">{quote}</p>
    </div>
  )
}

function BriefVisual() {
  const b = useT().features.brief
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4" aria-hidden="true">
      <div className="flex items-center justify-between text-[11px] text-[var(--lx-dim)]">
        <span>{b.from}</span>
        <span>{b.when}</span>
      </div>
      <div className="mt-3 text-[14px] font-medium text-[var(--lx-text)]">{b.subject}</div>
      <div className="mt-3 space-y-2 text-[12.5px] text-[var(--lx-muted)]">
        <div className="flex justify-between"><span>{b.lines[0]}</span><span className="text-[#8caaab]">▲</span></div>
        <div className="flex justify-between"><span>{b.lines[1]}</span><span className="text-[#8caaab]">▲</span></div>
        <div className="flex justify-between"><span>{b.lines[2]}</span><span className="text-[var(--lx-dim)]">–</span></div>
      </div>
    </div>
  )
}

function TrendVisual() {
  const [ref, on] = useInView<HTMLDivElement>({ threshold: 0.5 })
  const tr = useT().features.trend
  const pts = [34, 36, 35, 41, 44, 43, 49, 53, 52, 58, 63, 67]
  const w = 300
  const h = 120
  const path = pts.map((v, i) => `${i ? "L" : "M"}${(i / (pts.length - 1)) * w},${h - (v / 80) * h}`).join(" ")
  return (
    <div ref={ref} aria-hidden="true">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--lx-dim)]">{tr.label}</span>
        <span className="lx-display text-2xl text-[var(--lx-text)]">
          67 <span className="text-sm text-[#8caaab]">+33</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 6}`} preserveAspectRatio="none" className="mt-3 h-[130px] w-full overflow-visible">
        <defs>
          <linearGradient id="lx-trend" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fa5935" stopOpacity=".35" />
            <stop offset="1" stopColor="#fa5935" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L${w},${h + 6} L0,${h + 6} Z`} fill="url(#lx-trend)" style={{ opacity: on ? 1 : 0, transition: "opacity 1.2s ease .9s" }} />
        <path d={path} fill="none" stroke="#fa5935" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={on ? 0 : 1} style={{ transition: "stroke-dashoffset 2.2s cubic-bezier(.16,1,.3,1) .2s" }} />
      </svg>
      <p className="mt-1 text-[10px] text-[var(--lx-dim)]">{tr.example}</p>
    </div>
  )
}

function TeamVisual() {
  const people = [
    { i: "AK", s: 72, c: "#fa5935" },
    { i: "MB", s: 58, c: "#8caaab" },
    { i: "SL", s: 81, c: "#f7b49b" },
    { i: "TW", s: 44, c: "#aa9175" },
  ]
  return (
    <div className="space-y-2" aria-hidden="true">
      {people.map(x => (
        <div key={x.i} className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-[#0b1312]" style={{ background: x.c }}>
            {x.i}
          </span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <span className="block h-full rounded-full transition-[width] duration-1000 group-hover:brightness-125" style={{ width: `${x.s}%`, background: x.c }} />
          </span>
          <span className="lx-num w-7 text-right text-[13px] text-[var(--lx-text)]">{x.s}</span>
        </div>
      ))}
    </div>
  )
}

export function Features() {
  const f = useT().features
  return (
    <section className="relative pb-16 pt-28 sm:pb-20 sm:pt-36" aria-label={f.aria}>
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <Chapter n="05" title={f.chapter} />
            <SplitHeading className="mt-7 text-[clamp(2.3rem,5vw,4.8rem)]" parts={f.heading} />
          </div>
          <Reveal delay={200}>
            <p className="lx-lead max-w-[440px] lg:ml-auto">
              {f.lead}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-6 lg:mt-20">
          <Tile className="md:col-span-3 lg:col-span-2" title={f.impulse.title} text={f.impulse.text}>
            <ImpulseVisual />
          </Tile>
          <Tile className="md:col-span-3 lg:col-span-2" delay={80} title={f.actions.title} text={f.actions.text}>
            <ActionsVisual />
          </Tile>
          <Tile className="md:col-span-6 lg:col-span-2" delay={160} tag={f.voice.tag} title={f.voice.title} text={f.voice.text}>
            <VoiceVisual />
          </Tile>
          <Tile className="md:col-span-3" delay={0} title={f.brief.title} text={f.brief.text}>
            <BriefVisual />
          </Tile>
          <Tile className="md:col-span-3" delay={80} title={f.trend.title} text={f.trend.text}>
            <TrendVisual />
          </Tile>
          <Tile className="md:col-span-6" delay={0} tag={f.team.tag} title={f.team.title} text={f.team.text}>
            <div className="grid gap-8 md:grid-cols-2">
              <TeamVisual />
              <div className="hidden rounded-2xl bg-[#03110f]/80 p-4 font-mono text-[11.5px] leading-relaxed text-[var(--lx-muted)] md:block" aria-hidden="true">
                <div className="text-[var(--lx-peach)]">$ curl https://digital-halo.de/api/v2/… {"\\"}</div>
                <div className="pl-4">-H &quot;Authorization: Bearer …&quot;</div>
                <div className="mt-3 text-[var(--lx-dim)]">{f.team.api1}</div>
                <div className="text-[var(--lx-dim)]">{f.team.api2}</div>
              </div>
            </div>
          </Tile>
        </div>
      </div>
    </section>
  )
}
