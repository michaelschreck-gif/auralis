"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion, useScrollProgress } from "./hooks"
import { Arrow, HaloMark, SplitHeading } from "./primitives"

const NAV = [
  { href: "#geschichte", label: "Die Geschichte" },
  { href: "#messung", label: "Messung" },
  { href: "#score", label: "Halo Score" },
  { href: "#preise", label: "Preise" },
  { href: "#faq", label: "FAQ" },
]

export function Nav({ toolHref, isLoggedIn }: { toolHref: string; isLoggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      setScrolled(y > 24)
      // Beim Runterscrollen ausblenden, beim Hochscrollen sofort zurück.
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 400)
        last = y
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <header className={`lx-nav ${scrolled ? "is-scrolled" : ""} ${hidden && !open ? "is-hidden" : ""}`}>
        <nav className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8" aria-label="Hauptnavigation">
          <a href="#top" className="flex items-center" aria-label="DigitalHalo – zum Seitenanfang">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[22px] w-auto" />
          </a>
          <div className="hidden items-center gap-9 text-[13.5px] lg:flex">
            {NAV.map(n => (
              <a key={n.href} href={n.href} className="lx-navlink">
                {n.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a href={toolHref} className="hidden rounded-full px-4 py-2 text-[13.5px] font-medium text-[var(--lx-text)] transition-colors hover:bg-white/5 sm:inline-flex">
              {isLoggedIn ? "Zum Tool" : "Anmelden"}
            </a>
            <Link href="/registrieren" className="lx-btn lx-btn--primary !px-5 !py-2.5 !text-[13px]">
              Kostenloser Check
            </Link>
            <button
              type="button"
              className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lx-line-strong)] lg:hidden"
              aria-label={open ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={open}
              onClick={() => setOpen(o => !o)}
            >
              <span className="relative block h-3 w-4">
                <span className={`absolute left-0 right-0 h-px bg-current transition-transform duration-500 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 right-0 h-px bg-current transition-transform duration-500 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobiles Menü */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-end bg-[rgba(6,11,10,0.94)] px-6 pb-12 pt-28 backdrop-blur-xl transition-opacity duration-500 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!open}
      >
        <ul className="space-y-2">
          {NAV.map((n, i) => (
            <li key={n.href} style={{ transitionDelay: `${open ? 80 + i * 60 : 0}ms` }} className={`transition-all duration-700 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <a href={n.href} onClick={() => setOpen(false)} className="lx-display block py-2 text-4xl text-[var(--lx-text)]" tabIndex={open ? 0 : -1}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col gap-3">
          <Link href="/registrieren" className="lx-btn lx-btn--primary" tabIndex={open ? 0 : -1}>
            Kostenlosen Check starten <Arrow />
          </Link>
          <a href={toolHref} className="lx-btn lx-btn--ghost" tabIndex={open ? 0 : -1}>
            {isLoggedIn ? "Zum Tool" : "Anmelden"}
          </a>
        </div>
      </div>
    </>
  )
}

export function Hero() {
  const [ready, setReady] = useState(false)
  const [ref, scrollP] = useScrollProgress<HTMLElement>("leave")
  const reduced = useReducedMotion()
  // Bei reduzierter Bewegung bleibt der Hero ruhig stehen.
  const p = reduced ? 0 : scrollP
  const markRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120)
    return () => clearTimeout(t)
  }, [])

  // Das Zeichen neigt sich leicht zur Maus (nur Desktop, nicht bei reduzierter Bewegung).
  useEffect(() => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const el = markRef.current
        if (!el) return
        const x = e.clientX / window.innerWidth - 0.5
        const y = e.clientY / window.innerHeight - 0.5
        el.style.transform = `perspective(1200px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translate3d(${x * 18}px, ${y * 14}px, 0)`
      })
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [reduced])

  // Beim Wegscrollen: Inhalt hebt sich, Zeichen wächst und wird dunkler.
  const lift = p * 220
  const fade = Math.max(0, 1 - p * 1.6)

  return (
    <section ref={ref} id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pb-28 pt-28 sm:pt-32">
      {/* Licht im Raum */}
      <div className="lx-aura left-[-12%] top-[8%] h-[46vw] w-[46vw] bg-[#8caaab]/30" />
      <div className="lx-aura bottom-[-20%] right-[-8%] h-[52vw] w-[52vw] bg-[#fa5935]/25" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 70% 45%, transparent 0%, rgba(6,11,10,0.55) 70%, #060b0a 100%)" }}
      />

      {/* Halo-Zeichen */}
      <div
        className="pointer-events-none absolute right-[-38%] top-[30%] w-[100vw] max-w-[760px] opacity-30 sm:top-1/2 sm:right-[-12%] sm:opacity-60 sm:w-[70vw] md:opacity-100 lg:right-[3%] lg:w-[40vw]"
        style={{ transform: `translateY(calc(-50% + ${p * 120}px)) scale(${1 + p * 0.2})` }}
      >
        <div
          ref={markRef}
          className={`transition-[opacity,filter] duration-[2200ms] ${ready ? "opacity-100 blur-0" : "opacity-0 blur-2xl"}`}
          style={{ transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" }}
        >
          <HaloMark className="lx-breathe w-full" />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 sm:px-8" style={{ transform: `translate3d(0, ${-lift}px, 0)`, opacity: reduced ? 1 : fade }}>
        <div className="max-w-[860px]">
          <div className={`lx-reveal ${ready ? "is-in" : ""} mb-8 flex items-center gap-3`}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--lx-coral)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--lx-coral)]" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--lx-muted)]">KI-Reputation für Personal Brands</span>
          </div>

          <SplitHeading
            as="h1"
            start={ready}
            className="text-[clamp(2.8rem,6.6vw,6.3rem)] !leading-[0.98]"
            parts={["Die KI spricht\nüber dich.\n", { em: "Weißt du, was\nsie sagt?" }]}
          />

          <p className={`lx-reveal lx-lead mt-8 max-w-[560px] ${ready ? "is-in" : ""}`} style={{ "--d": "700ms" } as React.CSSProperties}>
            DigitalHalo misst, wie ChatGPT, Claude, Perplexity, Gemini und Google dich sehen – und verdichtet es zu einer Zahl,
            die du bewegen kannst: dem <span className="text-[var(--lx-text)]">Halo&nbsp;Score™</span>.
          </p>

          <div className={`lx-reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center ${ready ? "is-in" : ""}`} style={{ "--d": "850ms" } as React.CSSProperties}>
            <Link href="/registrieren" className="lx-btn lx-btn--primary">
              Kostenlosen Check starten <Arrow />
            </Link>
            <a href="#geschichte" className="lx-btn lx-btn--ghost">
              Die Geschichte sehen
            </a>
          </div>
          <p className={`lx-reveal mt-5 text-xs text-[var(--lx-dim)] ${ready ? "is-in" : ""}`} style={{ "--d": "1000ms" } as React.CSSProperties}>
            Kostenlos · keine Kreditkarte · Daten in der EU
          </p>
        </div>
      </div>

      {/* Modelle als Laufband + Scroll-Hinweis */}
      <div className={`lx-reveal absolute inset-x-0 bottom-0 z-10 ${ready ? "is-in" : ""}`} style={{ "--d": "1200ms" } as React.CSSProperties}>
        <div className="mx-auto flex max-w-[1320px] items-end justify-between gap-8 px-5 pb-8 sm:px-8">
          <div className="lx-marquee hidden min-w-0 max-w-[620px] flex-1 md:block">
            <div className="lx-marquee__track gap-12 text-[13px] text-[var(--lx-dim)]">
              {[0, 1].map(k => (
                <div key={k} className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={k === 1}>
                  {["Claude", "GPT-4o", "Perplexity", "Gemini", "Google-Suche", "Google KI-Übersicht"].map(m => (
                    <span key={m} className="flex items-center gap-3 whitespace-nowrap">
                      <span className="h-1 w-1 rounded-full bg-[var(--lx-coral)]" />
                      {m}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <a href="#geschichte" className="flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-[var(--lx-muted)]" aria-label="Weiter zur Geschichte">
            <span className="relative block h-10 w-px overflow-hidden bg-white/10">
              <span className="lx-scroll-cue absolute inset-0 bg-[var(--lx-peach)]" />
            </span>
            Scrollen
          </a>
        </div>
      </div>
    </section>
  )
}
