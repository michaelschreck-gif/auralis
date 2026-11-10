"use client"

import { useEffect, useRef, type CSSProperties } from "react"

/**
 * Ruhige Bewegung für den Kundenbereich (Design der Startseite).
 * Alles respektiert „Bewegung reduzieren“ des Betriebssystems.
 */

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Zahl, die beim Erscheinen sanft von 0 hochzählt. Server rendert den Endwert. */
export function CountUp({ value, duration = 1400, delay = 150, className, style }: { value: number; duration?: number; delay?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    let frame = 0
    let start = 0
    el.textContent = "0"
    const tick = (t: number) => {
      if (!start) start = t + delay
      const p = Math.min(1, Math.max(0, (t - start) / duration))
      const eased = 1 - Math.pow(1 - p, 4)
      el.textContent = String(Math.round(value * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      el.textContent = String(value)
    }
  }, [value, duration, delay])
  return (
    <span ref={ref} className={className} style={style}>
      {value}
    </span>
  )
}

/** Das Markensymbol als leuchtender, langsam umlaufender Lichtring. Rein dekorativ. */
export function HaloMark({ className = "" }: { className?: string }) {
  return (
    <div className={`h-mark ${className}`} aria-hidden="true">
      <div className="h-mark__glow">
        <div className="h-mark__mask">
          <div className="h-mark__spin" />
        </div>
      </div>
      <div className="h-mark__mask">
        <div className="h-mark__spin" />
      </div>
    </div>
  )
}

/**
 * Lichtkante unter dem Mauszeiger für alle `.h-card` innerhalb des Kundenbereichs.
 * Ein einziger Listener statt einer Logik pro Karte.
 */
export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    let frame = 0
    let last: PointerEvent | null = null
    const apply = () => {
      frame = 0
      const e = last
      if (!e) return
      const card = (e.target as Element | null)?.closest?.(".h-card") as HTMLElement | null
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty("--mx", `${e.clientX - r.left}px`)
      card.style.setProperty("--my", `${e.clientY - r.top}px`)
    }
    const onMove = (e: PointerEvent) => {
      last = e
      if (!frame) frame = requestAnimationFrame(apply)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return null
}
