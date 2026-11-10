"use client"

import { type CSSProperties, type ElementType, type MouseEvent, type ReactNode } from "react"
import { useInView } from "./hooks"

/** Das Markensymbol als leuchtender, umlaufender Lichtring. Rein dekorativ. */
export function HaloMark({ className = "", style, bloom = true, sheen = true }: {
  className?: string
  style?: CSSProperties
  bloom?: boolean
  sheen?: boolean
}) {
  return (
    <div className={`lx-halo ${className}`} style={style} aria-hidden="true">
      {bloom && (
        <div className="lx-halo__bloom">
          <div className="lx-halo__mask">
            <div className="lx-halo__spin" />
          </div>
        </div>
      )}
      <div className="lx-halo__glow">
        <div className="lx-halo__mask">
          <div className="lx-halo__spin" />
        </div>
      </div>
      <div className="lx-halo__mask">
        <div className="lx-halo__spin" />
        {sheen && <div className="lx-halo__sheen" />}
      </div>
    </div>
  )
}

/** Blendet Inhalt beim Hereinscrollen weich ein. */
export function Reveal({ children, as: Tag = "div", delay = 0, className = "" }: {
  children: ReactNode
  as?: ElementType
  delay?: number
  className?: string
}) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <Tag ref={ref} className={`lx-reveal ${inView ? "is-in" : ""} ${className}`} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}

type Part = string | { em: string }

/**
 * Überschrift, deren Wörter einzeln aus einer Maske aufsteigen.
 * `parts`: normale Textstücke oder { em } für kursive, leuchtende Betonung.
 * Zeilenumbrüche mit "\n".
 */
export function SplitHeading({ parts, as: Tag = "h2", className = "", delay = 0, start }: {
  parts: Part[]
  as?: ElementType
  className?: string
  delay?: number
  /** Von außen steuern (z. B. Hero sofort); sonst beim Hereinscrollen. */
  start?: boolean
}) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.3 })
  const on = start ?? inView
  let i = 0
  const label = parts.map(p => (typeof p === "string" ? p : p.em)).join("").replace(/\n/g, " ")
  return (
    <Tag ref={ref} className={`lx-display lx-words ${on ? "is-in" : ""} ${className}`} style={{ "--d": `${delay}ms` } as CSSProperties} aria-label={label}>
      {parts.map((p, pi) => {
        const text = typeof p === "string" ? p : p.em
        const em = typeof p !== "string"
        return text.split(/(\n| )/).map((tok, ti) => {
          if (tok === "\n") return <br key={`${pi}-${ti}`} />
          if (tok === " ") return " "
          if (!tok) return null
          const idx = i++
          return (
            <span key={`${pi}-${ti}`} className="lx-w" aria-hidden="true">
              <span className={em ? "lx-em" : undefined} style={{ "--i": idx } as CSSProperties}>{tok}</span>
            </span>
          )
        })
      })}
    </Tag>
  )
}

/** Setzt die Mausposition als CSS-Variablen für `.lx-spot`-Karten. */
export function onSpotMove(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty("--mx", `${e.clientX - r.left}px`)
  el.style.setProperty("--my", `${e.clientY - r.top}px`)
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`lx-eyebrow ${className}`}>{children}</span>
}

/** Kapitel-Kennung: „01 — Die Frage“. */
export function Chapter({ n, title }: { n: string; title: string }) {
  return (
    <Reveal className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--lx-muted)]">
      <span className="lx-display text-[var(--lx-peach)] text-base tracking-normal not-italic">{n}</span>
      <span className="h-px w-10 bg-[var(--lx-line-strong)]" />
      <span>{title}</span>
    </Reveal>
  )
}

export function Arrow() {
  return (
    <svg className="lx-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
