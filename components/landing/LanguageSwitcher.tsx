"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT, localeFromPath, routeOfPath, siteHref, type Locale } from "@/lib/i18n/site"
import { SITE_DICTS } from "./i18n"

const DISMISS_KEY = "halo-lang-suggest-dismissed"

/** Ziel derselben Seite in einer anderen Sprache (Startseite, falls unbekannt). */
function hrefFor(pathname: string, target: Locale): string {
  return siteHref(routeOfPath(pathname) ?? "home", target)
}

/** Kleiner Umschalter DE · EN · FR. Funktioniert auf jeder Seite der Webseite. */
export function LanguageSwitcher({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const pathname = usePathname() ?? "/"
  const current = localeFromPath(pathname)
  const t = SITE_DICTS[current]
  const base = tone === "dark" ? "text-[var(--lx-muted,#9aa6a2)] hover:text-white" : "text-[#6B625A] hover:text-[#0E1916]"
  const active = tone === "dark" ? "text-white" : "text-[#0E1916] font-semibold"
  return (
    <nav aria-label={t.lang.label} className={`flex items-center gap-1 text-[12px] font-medium tracking-[0.08em] ${className}`}>
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-30" aria-hidden="true">·</span>}
          <a
            href={hrefFor(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-current={l === current ? "true" : undefined}
            title={LOCALE_LABEL[l]}
            className={`rounded px-1 py-0.5 transition-colors ${l === current ? active : base}`}
          >
            {LOCALE_SHORT[l]}
          </a>
        </span>
      ))}
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
    <div lang={target} className="fixed inset-x-4 bottom-4 z-[80] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b1312]/90 px-4 py-3 text-[13px] text-[#efe9df] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:inset-x-auto sm:right-6">
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
