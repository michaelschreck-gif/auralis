"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"

const NAV = [
  { href: "/dashboard",                    label: "Übersicht",          icon: "overview" },
  { href: "/dashboard/persona",            label: "KI-Persona",         icon: "persona" },
  { href: "/dashboard/analyze",            label: "Analyse",            icon: "analyze" },
  { href: "/dashboard/ai-visibility",      label: "KI-Sichtbarkeit",    icon: "visibility" },
  { href: "/dashboard/geo",                label: "GEO Score",          icon: "geo" },
  { href: "/dashboard/seo",                label: "SEO Score",          icon: "seo" },
  { href: "/dashboard/thought-leadership", label: "Thought Leadership", icon: "thought" },
  { href: "/dashboard/topics",             label: "Themen",             icon: "topics" },
  { href: "/dashboard/sources",            label: "Quellen",            icon: "sources" },
  { href: "/dashboard/responses",          label: "KI-Antworten",       icon: "responses" },
  { href: "/dashboard/competitors",        label: "Wettbewerber",       icon: "competitors" },
  { href: "/dashboard/recommendations",    label: "Empfehlungen",       icon: "recommendations" },
  { href: "/dashboard/ask",                label: "Frag dein Profil",   icon: "ask" },
  { href: "/settings",                     label: "Einstellungen",      icon: "settings" },
] as const

type IconKey = typeof NAV[number]["icon"]

const Icons: Record<IconKey, ReactNode> = {
  overview: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  visibility: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>
    </svg>
  ),
  persona: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2.5 13c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  analyze: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 12V3M2 12h11M5 9.5l2.5-3 2 1.5 3-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sources: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2.5 2.5h6l4 4v6a1 1 0 01-1 1H2.5a1 1 0 01-1-1V3.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8.5 2.5v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M4 9h5M4 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  competitors: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2 13c0-1.66 1.34-3 3-3s3 1.34 3 3M8 13c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  geo: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1C4.46 1 2 3.46 2 6.5c0 4 5.5 7.5 5.5 7.5S13 10.5 13 6.5C13 3.46 10.54 1 7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="7.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  seo: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  thought: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M4 2h7v3.5a3.5 3.5 0 01-7 0V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M4 4H2.5v1A1.5 1.5 0 004 6.5M11 4h1.5v1A1.5 1.5 0 0111 6.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7.5 9v2.5M5 13.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  topics: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1.5 1.5h5l6.5 6.5-5 5-6.5-6.5V1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="5" cy="5" r="1" fill="currentColor"/>
    </svg>
  ),
  recommendations: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 12L12 3M12 3H6.5M12 3v5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ask: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 4a2 2 0 012-2h7a2 2 0 012 2v5a2 2 0 01-2 2H6l-3 2.5V11H4a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="5.5" cy="6.5" r="0.7" fill="currentColor"/>
      <circle cx="7.5" cy="6.5" r="0.7" fill="currentColor"/>
      <circle cx="9.5" cy="6.5" r="0.7" fill="currentColor"/>
    </svg>
  ),
  responses: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 2.5h9a1 1 0 011 1V10a1 1 0 01-1 1H6l-3 2.5V11a1 1 0 01-1-1V3.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5 5.5h5M5 7.8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.1 1.1M11 11l1.1 1.1M2.9 12.1l1.1-1.1M11 4l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
}

interface Props {
  userName?: string
  plan?: string
  panelHeader?: string
  panelCount?: string
  panelContent?: ReactNode
  panelFooter?: ReactNode
  children: ReactNode
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
}

export default function DashboardShell({
  userName = "",
  plan = "free",
  panelHeader = "Topics",
  panelCount,
  panelContent,
  panelFooter,
  children,
}: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = userName
    ? userName.split(" ").map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2)
    : "?"
  const planLabel = PLAN_LABELS[plan] ?? "Free"

  const navList = (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {NAV.map(item => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              active
                ? "bg-[#EEEDFE] text-[#534AB7] font-medium"
                : "text-[#6B6790] hover:text-[#26215C] hover:bg-[#F4F2FE]"
            }`}
          >
            <span className="w-4 flex-shrink-0 flex items-center justify-center">
              {Icons[item.icon]}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const sidebarFooter = (
    <div className="px-4 py-4 border-t border-[#EEEDFE] space-y-3">
      <div className="rounded-xl bg-[#26215C] px-3.5 py-3">
        <div className="text-[11px] text-[#CECBF6]">Dein Plan</div>
        <div className="text-[13px] text-white font-medium mt-0.5">{planLabel}</div>
      </div>
      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="block text-xs text-[#6B6790] hover:text-[#534AB7] transition-colors"
      >
        Zur Halo-Webseite ↗
      </a>
      <form action="/auth/signout" method="POST">
        <button
          type="submit"
          className="text-xs text-[#6B6790] hover:text-[#534AB7] transition-colors"
        >
          Abmelden →
        </button>
      </form>
    </div>
  )

  const brand = (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-block rounded-full flex-shrink-0"
        style={{ width: 24, height: 24, border: "4px solid #7F77DD", boxShadow: "0 0 0 3px #EEEDFE" }}
        aria-hidden
      />
      <span className="text-[#26215C] font-semibold text-sm tracking-tight">Halo</span>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-[#FCFCFE] overflow-hidden">

      {/* ─── Topbar (nur mobil: Hamburger + Brand + Avatar) ─── */}
      <header className="md:hidden h-[56px] flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-4 gap-3 z-20">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Menü öffnen"
          className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-[#475569] hover:bg-gray-100"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#26215C] flex items-center justify-center"><span className="text-white text-xs font-bold">H</span></div>
          <span className="text-[#0f172a] font-semibold text-sm">Halo</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          {userName && (
            <div className="w-8 h-8 rounded-full bg-[#EEEDFE] border border-[#CECBF6] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-[#534AB7]">{initials}</span>
            </div>
          )}
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── Sidebar (desktop) ─── */}
        <aside className="hidden md:flex w-[230px] flex-shrink-0 bg-white border-r border-[#EEEDFE] flex-col">
          <div className="px-5 pt-4 pb-2">{brand}</div>
          {navList}
          {sidebarFooter}
        </aside>

        {/* ─── Sidebar (mobile drawer) ─── */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative w-[260px] max-w-[80%] bg-white flex flex-col h-full">
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                {brand}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Menü schließen"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6790] hover:bg-[#F4F2FE]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
              {navList}
              {sidebarFooter}
            </aside>
          </div>
        )}

        {/* ─── Panel column (desktop only) ─── */}
        {panelContent !== undefined && (
          <div className="hidden lg:flex w-[300px] flex-shrink-0 bg-[#FCFCFE] border-r border-[#EEEDFE] flex-col overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#EEEDFE] flex items-center justify-between bg-white">
              <span className="text-sm font-semibold text-[#26215C]">{panelHeader}</span>
              {panelCount && (
                <span className="text-xs text-[#534AB7] bg-[#EEEDFE] px-2 py-0.5 rounded-full">
                  {panelCount}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {panelContent}
            </div>
            {panelFooter && (
              <div className="border-t border-[#EEEDFE]">{panelFooter}</div>
            )}
          </div>
        )}

        {/* ─── Main content ─── */}
        <main className="flex-1 overflow-y-auto bg-[#FCFCFE]">
          {children}
        </main>
      </div>
    </div>
  )
}
