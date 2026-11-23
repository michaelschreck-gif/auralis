"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT, localeFromPath, routeOfPath, siteHref, type Locale } from "@/lib/i18n/site"
import { SITE_DICTS } from "./i18n"

const DISMISS_KEY = "halo-lang-suggest-dismissed"

/** Ziel derselben Seite in einer anderen Sprache (Startseite, falls unbekannt). */
function hrefFor(pathname: string, target: Locale): string {
  return siteHref(routeOfPath(pathname) ?? "home", target)
}

/** Kleiner Umschalter DE · EN · FR. Funktioniert auf jeder Seite der Webseite. Auf dem Handy mit größeren Tippflächen. */
export function LanguageSwitcher({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const pathname = usePathname() ?? "/"
  const current = localeFromPath(pathname)
  const t = SITE_DICTS[current]
  const base = tone === "dark" ? "text-[var(--lx-muted,#9aa6a2)] hover:text-white" : "text-[#6B625A] hover:text-[#0E1916]"
  const active =
    tone === "dark"
      ? "text-white bg-white/10 sm:bg-transparent"
      : "text-[#0E1916] font-semibold bg-[#0E1916]/[0.06] sm:bg-transparent"
  return (
    <nav aria-label={t.lang.label} className={`flex items-center gap-0.5 text-[13px] font-medium tracking-[0.08em] sm:gap-1 sm:text-[12px] ${className}`}>
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-0.5 sm:gap-1">
          {i > 0 && <span className="opacity-30" aria-hidden="true">·</span>}
          <a
            href={hrefFor(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-current={l === current ? "true" : undefined}
            title={LOCALE_LABEL[l]}
            className={`inline-flex min-h-8 min-w-8 items-center justify-center rounded-md px-1.5 transition-colors sm:min-h-0 sm:min-w-0 sm:rounded sm:px-1 sm:py-0.5 ${l === current ? active : base}`}
          >
            {LOCALE_SHORT[l]}
          </a>
        </span>
      ))}
    </nav>
  )
}

function GlobeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" className={className}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5M8 1.75c1.7 1.75 2.55 3.83 2.55 6.25S9.7 12.5 8 14.25M8 1.75C6.3 3.5 5.45 5.58 5.45 8S6.3 12.5 8 14.25" />
    </svg>
  )
}

/**
 * Sprachwahl für die mobile Kopfzeile: Weltkugel + aktuelle Sprache, öffnet eine kleine Liste.
 * Immer sichtbar, ohne erst das Menü zu öffnen.
 */
export function LanguageMenu({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/"
  const current = localeFromPath(pathname)
  const t = SITE_DICTS[current]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t.lang.label}: ${LOCALE_LABEL[current]}`}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[var(--lx-line-strong,rgba(255,255,255,0.18))] px-2.5 text-[12.5px] font-semibold tracking-[0.08em] text-[var(--lx-text,#efe9df)]"
      >
        <GlobeIcon className="h-4 w-4 opacity-80" />
        {LOCALE_SHORT[current]}
      </button>
      {open && (
        <ul
          role="list"
          aria-label={t.lang.label}
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[168px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1312]/95 p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          {LOCALES.map(l => (
            <li key={l}>
              <a
                href={hrefFor(pathname, l)}
                hrefLang={l}
                lang={l}
                aria-current={l === current ? "true" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] ${l === current ? "bg-white/10 text-white" : "text-[#c9c2b8] hover:bg-white/5 hover:text-white"}`}
              >
                <span>{LOCALE_LABEL[l]}</span>
                <span className="text-[11px] font-semibold tracking-[0.1em] opacity-60">{LOCALE_SHORT[l]}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Große Auswahl mit ausgeschriebenen Sprachen, z. B. im mobilen Menü. */
export function LanguagePills({ className = "", tabbable = true }: { className?: string; tabbable?: boolean }) {
  const pathname = usePathname() ?? "/"
  const current = localeFromPath(pathname)
  const t = SITE_DICTS[current]
  return (
    <nav aria-label={t.lang.label} className={className}>
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lx-muted,#9aa6a2)]">
        <GlobeIcon className="h-3.5 w-3.5" />
        {t.lang.label}
      </p>
      <div className="grid grid-cols-3 gap-1 rounded-full border border-[var(--lx-line-strong,rgba(255,255,255,0.18))] p-1">
        {LOCALES.map(l => (
          <a
            key={l}
            href={hrefFor(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-current={l === current ? "true" : undefined}
            tabIndex={tabbable ? 0 : -1}
            className={`rounded-full py-2.5 text-center text-[14px] font-medium transition-colors ${l === current ? "bg-[#efe9df] text-[#0b1312]" : "text-[var(--lx-text,#efe9df)] hover:bg-white/5"}`}
          >
            {LOCALE_LABEL[l]}
          </a>
        ))}
      </div>
    </nav>
  )
}

function browserLocale(): Locale | null {
  for (const raw of navigator.languages ?? [navigator.language]) {
    const l = raw?.slice(0, 2).toLowerCase()
    if (l === "de" || l === "en" || l === "fr") return l
  }
  return null
}

/**
 * Hinweis, wenn die Browsersprache zu einer anderen Fassung passt. Keine automatische
 * Weiterleitung (Suchmaschinen und geteilte Links sollen die gewählte Sprache sehen).
 */
export function LanguageSuggest() {
  const pathname = usePathname() ?? "/"
  const current = localeFromPath(pathname)
  const [target, setTarget] = useState<Locale | null>(null)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1"
    } catch {}
    const b = browserLocale()
    if (dismissed || !b || b === current) return
    const id = setTimeout(() => setTarget(b), 1200)
    return () => clearTimeout(id)
  }, [current])

  if (!target) return null
  const t = SITE_DICTS[target]
  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {}
    setTarget(null)
  }
  return (
    <div lang={target} className="fixed inset-x-4 bottom-4 z-[35] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b1312]/90 px-4 py-3 text-[13px] text-[#efe9df] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:inset-x-auto sm:right-6">
      <span>{t.lang.suggest}</span>
      <span className="flex shrink-0 items-center gap-2">
        <a href={hrefFor(pathname, target)} className="rounded-full bg-[#fa5935] px-3 py-1.5 text-[12px] font-semibold text-white">
          {t.lang.suggestCta}
        </a>
        <button type="button" onClick={close} aria-label={t.lang.dismiss} className="px-1 text-[16px] leading-none text-[#9aa6a2] hover:text-white">
          ×
        </button>
      </span>
    </div>
  )
}
