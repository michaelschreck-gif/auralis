"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HaloDark } from "./ui"
import { HaloMark } from "./motion"

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
    { href: `${base}/impulse`, label: "Impulse", icon: icon("M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z") },
    { href: `${base}/massnahmen`, label: "Maßnahmen", icon: icon("M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9") },
    { href: `${base}/persona`, label: "Wie die KI dich sieht", icon: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0") },
  ]
}

export default function PersonShell({
  personId,
  personName,
  accountName,
  teamPersons,
  isOwner,
  children,
}: {
  personId: string
  personName: string
  accountName: string
  /** Nur bei Team-Ownern gefüllt. */
  teamPersons: { id: string; name: string }[]
  /** Owner sehen den Link zum Konto (Name, API-Schlüssel). */
  isOwner: boolean
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
      <div className="px-5 pt-7 pb-6">
        <Link href="/weiter" aria-label="DigitalHalo – Start">
          <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[20px] w-auto" />
        </Link>
      </div>

      <div className="px-3">
        {teamPersons.length > 0 ? (
          <div className="rounded-2xl bg-white/[0.035] border border-white/[0.08] p-3">
            <Link href="/personen" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F7B49B] hover:text-white transition-colors">
              ← {accountName}
            </Link>
            <select
              aria-label="Person wechseln"
              value={personId}
              onChange={e => (window.location.href = `/p/${e.target.value}`)}
              className="mt-2 w-full rounded-lg bg-white/[0.04] border border-white/[0.12] text-sm text-white px-2 py-1.5 focus:outline-none focus:border-[#F7B49B]/60"
            >
              {teamPersons.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <HaloMark className="h-breathe w-7 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F7B49B]">Person</span>
              <span className="block text-sm font-medium text-white mt-0.5 truncate">{personName}</span>
            </div>
          </div>
        )}
      </div>

      <nav className="mt-6 flex-1 px-3 space-y-0.5" aria-label="Hauptnavigation">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ${
              isActive(item.href)
                ? "bg-gradient-to-r from-[#FA5935]/[0.18] to-transparent text-white shadow-[inset_0_0_0_1px_rgba(247,180,155,0.18)]"
                : "text-[var(--h-side-text)] hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {isActive(item.href) && <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[#FA5935] shadow-[0_0_12px_#FA5935]" aria-hidden />}
            <span className={isActive(item.href) ? "text-[#F7B49B]" : "opacity-70 group-hover:opacity-100 transition-opacity"}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mx-3 mb-5 pt-3 border-t border-white/[0.08] space-y-0.5">
        <Link
          href={settingsHref}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            isActive(settingsHref) ? "bg-white/[0.06] text-white" : "text-[var(--h-side-text)] hover:text-white"
          }`}
        >
          {icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z")}
          Einstellungen
        </Link>
        {isOwner && (
          <Link href="/konto" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--h-side-text)] hover:text-white transition-colors">
            {icon("M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2")}
            Konto
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button type="submit" className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--h-side-text)] hover:text-white transition-colors">
            {icon("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9")}
            Abmelden
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <HaloDark className="md:flex">
      {/* Mobil: Kopfzeile mit Menü */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.08] bg-[#060b0a]/70 px-4 py-3 backdrop-blur-xl">
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
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Menü schließen" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-[#081110] border-r border-white/[0.08] overflow-y-auto">{sidebar}</aside>
        </div>
      )}

      <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-white/[0.07] bg-white/[0.015] backdrop-blur-xl">{sidebar}</aside>

      <main key={pathname} className="h-stage flex-1 min-w-0 px-4 py-7 md:px-12 md:py-12">{children}</main>
    </HaloDark>
  )
}
