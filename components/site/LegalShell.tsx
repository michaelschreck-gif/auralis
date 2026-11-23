import Link from "next/link"
import type { ReactNode } from "react"
import { siteHref, type Locale } from "@/lib/i18n/site"
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher"
import { SITE_TEXTS } from "./texts"

/** Rahmen der Rechtstexte (Impressum, Datenschutz, AGB) in einer Sprache. */
export function LegalShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const all = SITE_TEXTS[locale]
  const t = all.legal
  const home = siteHref("home", locale)
  const LEGAL_PAGES = [
    { href: siteHref("imprint", locale), label: t.imprint },
    { href: siteHref("privacy", locale), label: t.privacy },
    { href: siteHref("terms", locale), label: t.terms },
  ]
  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0E1916]" lang={locale}>
      {/* Top bar */}
      <header className="bg-white border-b border-[#E9E1D3]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={home} className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/combinationmark-black.svg" alt="DigitalHalo" className="h-5 w-auto" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <LanguageSwitcher tone="light" />
            <span className="text-[#9A9089] hidden sm:inline">{t.section}</span>
            <Link href={home} className="text-[#FA5935] hover:underline font-medium">
              {all.backHome}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 hidden lg:block">
          <div className="sticky top-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9089] mb-3">
              {t.documents}
            </p>
            <nav className="space-y-1">
              {LEGAL_PAGES.map(p => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="block text-sm text-[#6B625A] hover:text-[#FA5935] py-1.5 transition-colors font-medium"
                >
                  {p.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 space-y-6">
          {t.bindingNote && (
            <p className="rounded-2xl border border-[#E9E1D3] bg-[#F3EFE6] px-5 py-3 text-xs text-[#6B625A]">{t.bindingNote}</p>
          )}
          {children}

          <footer className="pt-6 border-t border-[#E9E1D3] text-xs text-[#9A9089]">
            <p>
              {t.footer} · <Link href={home} className="hover:underline">{all.home}</Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
