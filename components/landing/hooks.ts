"use client"

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react"

/** true, wenn der Nutzer reduzierte Bewegung wünscht (Betriebssystem-Einstellung). */
const RM_QUERY = "(prefers-reduced-motion: reduce)"
function subscribeRM(cb: () => void) {
  const mq = window.matchMedia(RM_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeRM, () => window.matchMedia(RM_QUERY).matches, () => false)
}

/** Einmalig true, sobald das Element in den Viewport kommt. */
export function useInView<T extends Element>(options: { threshold?: number; rootMargin?: string } = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const { threshold = 0.2, rootMargin = "0px 0px -8% 0px" } = options
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, threshold, rootMargin])
  return [ref, inView]
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/**
 * Scroll-Fortschritt 0..1 eines Abschnitts.
 *  - "pin":     für hohe Container mit `position: sticky`-Innenleben – 0 wenn die Oberkante
 *               den Viewport-Rand erreicht, 1 wenn die Unterkante unten ankommt.
 *  - "through": 0 sobald die Oberkante unten hereinkommt, 1 wenn die Unterkante oben hinausgeht.
 *  - "enter":   0 sobald die Oberkante unten hereinkommt, 1 wenn die Oberkante oben ankommt.
 *  - "leave":   0 solange die Oberkante oben steht, 1 wenn die Unterkante oben hinausgeht.
 * Mit reduzierter Bewegung immer 1 (Endzustand, alles sichtbar).
 */
export function useScrollProgress<T extends HTMLElement>(mode: "pin" | "through" | "enter" | "leave" = "pin"): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [p, setP] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    let frame = 0
    let last = -1
    const measure = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      let v: number
      if (mode === "pin") v = clamp01(-r.top / Math.max(1, r.height - vh))
      else if (mode === "through") v = clamp01((vh - r.top) / (r.height + vh))
      else if (mode === "enter") v = clamp01((vh - r.top) / vh)
      else v = clamp01(-r.top / Math.max(1, r.height))
      const rounded = Math.round(v * 1000) / 1000
      if (rounded !== last) {
        last = rounded
        setP(rounded)
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [mode, reduced])

  return [ref, reduced ? 1 : p]
}

/** Teilbereich eines Fortschritts: map(p, 0.2, 0.5) → 0..1 zwischen 20 % und 50 %. */
export function seg(p: number, from: number, to: number): number {
  return clamp01((p - from) / (to - from))
}

/** Sanfte Kurve für Bewegungen. */
export function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
