import Link from "next/link"
import type { ReactNode } from "react"

const LEGAL_PAGES = [
  { href: "/legal/impressum",   label: "Impressum" },
  { href: "/legal/datenschutz", label: "Datenschutz" },
  { href: "/legal/agb",         label: "AGB" },
]

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0f172a]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4F6EF7] flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="text-[#0f172a] font-semibold text-sm tracking-tight">Halo</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#94a3b8] hidden sm:inline">Rechtliches</span>
            <Link href="/" className="text-[#4F6EF7] hover:underline font-medium">
              Zur Startseite →
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 hidden lg:block">
          <div className="sticky top-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-3">
              Dokumente
            </p>
            <nav className="space-y-1">
              {LEGAL_PAGES.map(p => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="block text-sm text-[#64748b] hover:text-[#4F6EF7] py-1.5 transition-colors font-medium"
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
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-[#0f172a] leading-relaxed">
            <p className="font-semibold mb-1">⚠ Vorlage — anwaltlich prüfen lassen</p>
            <p className="text-[#64748b]">
              Dieser Text ist eine technische Vorlage, generiert auf Basis typischer SaaS-Geschäfts­modelle.
              <strong className="text-[#0f172a]"> Vor Veröffentlichung bitte juristisch prüfen lassen </strong>
              und insbesondere Adresse, Vertretungsberechtigte, USt-IdNr., Handelsregister-Daten,
              tatsächliche Datenverarbeitungs-Vorgänge sowie konkrete Tarife einsetzen oder anpassen.
            </p>
          </div>

          {children}

          <footer className="pt-6 border-t border-gray-200 text-xs text-[#94a3b8]">
            <p>
              Halo · Halo UG (haftungsbeschränkt) · <Link href="/" className="hover:underline">Startseite</Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
