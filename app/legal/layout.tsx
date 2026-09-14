import Link from "next/link"
import type { ReactNode } from "react"

const LEGAL_PAGES = [
  { href: "/legal/impressum",   label: "Impressum" },
  { href: "/legal/datenschutz", label: "Datenschutz" },
  { href: "/legal/agb",         label: "AGB" },
]

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0E1916]">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E9E1D3]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-4 w-auto" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#9A9089] hidden sm:inline">Rechtliches</span>
            <Link href="/" className="text-[#FA5935] hover:underline font-medium">
              Zur Startseite →
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 hidden lg:block">
          <div className="sticky top-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9089] mb-3">
              Dokumente
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
          {/* Draft warning */}
          <div className="rounded-xl bg-[#F6ECD9] border border-[#E7CFA3] px-4 py-3 text-xs text-[#0E1916] leading-relaxed">
            <p className="font-semibold mb-1">⚠ Vorlage — anwaltlich prüfen lassen</p>
            <p className="text-[#6B625A]">
              Dieser Text ist eine technische Vorlage, generiert auf Basis typischer SaaS-Geschäfts­modelle.
              <strong className="text-[#0E1916]"> Vor Veröffentlichung bitte juristisch prüfen lassen </strong>
              und insbesondere Adresse, Vertretungsberechtigte, USt-IdNr., Handelsregister-Daten,
              tatsächliche Datenverarbeitungs-Vorgänge sowie konkrete Tarife einsetzen oder anpassen.
            </p>
          </div>

          {children}

          <footer className="pt-6 border-t border-[#E9E1D3] text-xs text-[#9A9089]">
            <p>
              Halo · Halo UG (haftungsbeschränkt) i. G. · <Link href="/" className="hover:underline">Startseite</Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
