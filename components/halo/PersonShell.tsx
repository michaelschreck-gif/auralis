"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = { href: string; label: string; icon: React.ReactNode }

const icon = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)

function navFor(base: string): NavItem[] {
  return [
    { href: base, label: "Halo Score", icon: icon("M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5") },
    { href: `${base}/ki`, label: "KI-Sichtbarkeit", icon: icon("M4 6h16M4 12h10M4 18h7M18 15l3 3-3 3") },
    { href: `${base}/google`, label: "Google-Sichtbarkeit", icon: icon("M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3") },
    { href: `${base}/wettbewerber`, label: "Wettbewerber", icon: icon("M4 20V10M10 20V4M16 20v-7M22 20H2") },
    { href: `${base}/massnahmen`, label: "Maßnahmen", icon: icon("M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9") },
    { href: `${base}/persona`, label: "Wie die KI dich sieht", icon: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0") },
  ]
}

export default function PersonShell({
  personId,
  personName,
  accountName,
  teamPersons,
  children,
}: {
  personId: string
  personName: string
  accountName: string
  /** Nur bei Team-Ownern gefüllt. */
  teamPersons: { id: string; name: string }[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const base = `/p/${personId}`
  const items = navFor(base)
  const settingsHref = `${base}/einstellungen`

  const isActive = (href: string) => (href === base ? pathname === base : pathname === href || pathname.startsWith(href + "/"))

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-5">
        <img src="/brand/combinationmark-white.svg" alt="Halo" className="h-[20px] w-auto" />
      </div>

      <div className="px-3">
        {teamPersons.length > 0 ? (
          <div className="rounded-xl bg-white/[0.05] border border-white/10 p-3">
            <Link href="/personen" className="text-[11px] uppercase tracking-wider text-[#F7B49B] hover:text-white">
              ← {accountName}
            </Link>
            <select
              aria-label="Person wechseln"
              value={personId}
              onChange={e => (window.location.href = `/p/${e.target.value}`)}
              className="mt-2 w-full rounded-lg bg-[#0E1916] border border-white/15 text-sm text-white px-2 py-1.5"
            >
              {teamPersons.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="px-2">
            <span className="block text-[11px] uppercase tracking-wider text-[#F7B49B]">Person</span>
            <span className="block text-sm font-medium text-white mt-1 truncate">{personName}</span>
          </div>
        )}
      </div>

      <nav className="mt-5 flex-1 px-3 space-y-0.5" aria-label="Hauptnavigation">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive(item.href) ? "bg-[#FA5935] text-white" : "text-[#D9D2C7] hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-white/10 space-y-0.5">
        <Link
          href={settingsHref}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
            isActive(settingsHref) ? "bg-white/[0.08] text-white" : "text-[#D9D2C7] hover:text-white"
          }`}
        >
          {icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z")}
          Einstellungen
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#D9D2C7] hover:text-white">
            {icon("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9")}
            Abmelden
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAF8F3] md:flex">
      {/* Mobil: Kopfzeile mit Menü */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-[#0E1916] px-4 py-3">
        <img src="/brand/combinationmark-white.svg" alt="Halo" className="h-[18px] w-auto" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-white p-1.5 -mr-1.5"
          aria-label="Menü öffnen"
          aria-expanded={open}
        >
          {icon("M3 6h18M3 12h18M3 18h18")}
        </button>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Menü schließen" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-[#0E1916] overflow-y-auto">{sidebar}</aside>
        </div>
      )}

      <aside className="hidden md:block w-64 shrink-0 bg-[#0E1916] sticky top-0 h-screen overflow-y-auto">{sidebar}</aside>

      <main className="flex-1 min-w-0 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  )
}
