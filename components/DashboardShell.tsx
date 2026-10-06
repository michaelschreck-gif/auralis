"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"

// ─── Navigation: Icon-Leiste mit Flyouts (Leadesk-Stil), je nach Tarif zwei Abläufe ───
type IconKey =
  | "overview" | "visibility" | "persona" | "monopoly" | "recommended" | "analyze"
  | "sources" | "competitors" | "geo" | "seo" | "thought" | "topics"
  | "recommendations" | "ask" | "responses" | "settings" | "team" | "setup"

type NavItem = { href: string; label: string; icon: IconKey }
type RailGroup = { label: string; icon: IconKey; items: NavItem[] }

const SETUP_GROUP: RailGroup = {
  label: "Setup", icon: "setup",
  items: [{ href: "/dashboard/setup", label: "Setup", icon: "setup" }],
}
const SCORES_GROUP: RailGroup = {
  label: "Scores", icon: "visibility",
  items: [
    { href: "/dashboard/ai-visibility",      label: "KI-Reputation",      icon: "visibility" },
    { href: "/dashboard/geo",                label: "GEO Score",          icon: "geo" },
    { href: "/dashboard/seo",                label: "SEO Score",          icon: "seo" },
    { href: "/dashboard/thought-leadership", label: "Thought Leadership", icon: "thought" },
  ],
}
const INSIGHTS_GROUP: RailGroup = {
  label: "Insights", icon: "topics",
  items: [
    { href: "/dashboard/topics",      label: "Themen",         icon: "topics" },
    { href: "/dashboard/monopoly",    label: "Themen-Monopol", icon: "monopoly" },
    { href: "/dashboard/sources",     label: "Quellen",        icon: "sources" },
    { href: "/dashboard/responses",   label: "KI-Antworten",   icon: "responses" },
    { href: "/dashboard/competitors", label: "Wettbewerber",   icon: "competitors" },
  ],
}
const ACTIONS_GROUP: RailGroup = {
  label: "Aktionen", icon: "recommendations",
  items: [
    { href: "/dashboard/recommendations", label: "Empfehlungen",        icon: "recommendations" },
    { href: "/dashboard/recommended",     label: "Wirst du empfohlen?", icon: "recommended" },
    { href: "/dashboard/ask",             label: "Frag dein Profil",    icon: "ask" },
  ],
}
const SETTINGS_GROUP: RailGroup = {
  label: "Account", icon: "settings",
  items: [{ href: "/settings", label: "Einstellungen", icon: "settings" }],
}

// Einzeluser (Free / Starter / Pro): persönlicher Halo Score
const SINGLE_RAIL: RailGroup[] = [
  { label: "Übersicht", icon: "overview", items: [{ href: "/dashboard", label: "Übersicht", icon: "overview" }] },
  SETUP_GROUP,
  {
    label: "Analyse", icon: "analyze",
    items: [
      { href: "/dashboard/analyze", label: "Analyse",    icon: "analyze" },
      { href: "/dashboard/persona", label: "KI-Persona", icon: "persona" },
    ],
  },
  SCORES_GROUP,
  INSIGHTS_GROUP,
  ACTIONS_GROUP,
]

// Corporate (Enterprise): Team-Übersicht + Personen, eigenes Profil bleibt erreichbar
const CORPORATE_RAIL: RailGroup[] = [
  { label: "Team-Übersicht", icon: "overview", items: [{ href: "/dashboard", label: "Team-Übersicht", icon: "overview" }] },
  SETUP_GROUP,
  { label: "Personen", icon: "team", items: [{ href: "/dashboard/team", label: "Personen", icon: "team" }] },
  {
    label: "Mein Profil", icon: "persona",
    items: [
      { href: "/dashboard/me",      label: "Mein Score", icon: "overview" },
      { href: "/dashboard/analyze", label: "Analyse",    icon: "analyze" },
      { href: "/dashboard/persona", label: "KI-Persona", icon: "persona" },
    ],
  },
  SCORES_GROUP,
  INSIGHTS_GROUP,
  ACTIONS_GROUP,
]

export const Icons: Record<IconKey, ReactNode> = {
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
  monopoly: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 4.5l2.5 2L7.5 2l3 4.5L13 4.5l-1 7.5H3l-1-7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  recommended: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M4.5 6.5v6M4.5 6.5L7 1.5c1 0 1.6.8 1.4 1.8L8 5.5h3.6c.8 0 1.4.7 1.2 1.5l-1 4.5c-.1.6-.7 1-1.3 1H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
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
  setup: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 4h6M11 4h2M2 11h2M7 11h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="9.5" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="5.5" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  team: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="5.2" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10.6" cy="5.6" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1.5 12.5c0-2.2 1.7-3.6 3.7-3.6s3.7 1.4 3.7 3.6M9.4 9.2c1.9-.3 4.1.8 4.1 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
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

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(href + "/")
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const initials = userName
    ? userName.split(" ").map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2)
    : "?"
  const firstName = userName.split(" ")[0] ?? ""
  const planLabel = PLAN_LABELS[plan] ?? "Free"
  const isCorporate = plan === "enterprise"
  const rail = isCorporate ? CORPORATE_RAIL : SINGLE_RAIL

  const railBtn = (active: boolean) =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
      active ? "bg-[#FDE7E0] text-[#C8431F]" : "text-[#5E6563] hover:bg-[#F3EFE6] hover:text-[#0E1916]"
    }`

  const renderGroup = (group: RailGroup) => {
    const first = group.items[0]
    const active = group.items.some(i => isActive(pathname, i.href))
    return (
      <div className="group relative">
        <Link href={first.href} aria-label={group.label} className={railBtn(active)}>
          <span className="scale-[1.15]">{Icons[group.icon]}</span>
        </Link>
        <div className="hidden group-hover:block group-focus-within:block absolute left-full top-0 pl-2 z-50">
          <div className="w-56 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_14px_40px_-16px_rgba(14,25,22,0.25)] p-2">
            <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9A9089]">
              {group.label}
            </div>
            {group.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] ${
                  isActive(pathname, item.href)
                    ? "bg-[#FDE7E0] text-[#C8431F] font-semibold"
                    : "text-[#3D4A46] hover:bg-[#F6F3EC]"
                }`}
              >
                <span className="w-4 flex items-center justify-center">{Icons[item.icon]}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Mobile-Drawer: alle Gruppen aufgeklappt
  const drawerNav = (
    <nav className="flex-1 px-3 py-3 overflow-y-auto">
      {[...rail, SETTINGS_GROUP].map(group => (
        <div key={group.label} className="mb-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9A9089] px-3 pt-3 pb-1.5">
            {group.label}
          </div>
          {group.items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] mb-0.5 ${
                isActive(pathname, item.href)
                  ? "bg-[#FDE7E0] text-[#C8431F] font-semibold"
                  : "text-[#3D4A46] hover:bg-[#F6F3EC]"
              }`}
            >
              <span className="w-4 flex items-center justify-center">{Icons[item.icon]}</span>
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )

  const brand = (
    <Link href="/dashboard" className="flex items-center flex-shrink-0">
      <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-6 w-auto" />
    </Link>
  )

  return (
    <div className="app-shell flex flex-col h-screen bg-white overflow-hidden">

      {/* ─── Top-Leiste ─── */}
      <header className="h-14 flex-shrink-0 flex items-center gap-3 px-4 z-30">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Menü öffnen"
          className="md:hidden w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-[#5E6563] hover:bg-[#F3EFE6]"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
        {brand}

        <Link
          href="/dashboard/analyze"
          className="hidden md:inline-flex ml-4 h-9 items-center rounded-full bg-[#0E1916] hover:bg-[#1E2E29] text-white text-[13px] font-semibold px-4 transition-colors"
        >
          Neue Analyse
        </Link>
        <Link
          href="/dashboard/ask"
          className="hidden md:inline-flex h-9 items-center gap-2 rounded-full border border-[#E9E1D3] bg-white hover:bg-[#F6F3EC] text-[#0E1916] text-[13px] font-semibold px-4 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-[#FA5935]" />
          Frag dein Profil
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <span
            className={`hidden sm:inline-flex h-8 items-center rounded-xl px-3 text-[12.5px] font-bold ${
              isCorporate ? "bg-[#0E1916] text-white" : "bg-[#E8EEEE] text-[#1C2A2A]"
            }`}
          >
            {planLabel}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              className="flex items-center gap-2 h-9 rounded-full pl-1 pr-3 hover:bg-[#F3EFE6] transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-[#0E1916] text-white text-xs font-bold flex items-center justify-center">
                {initials}
              </span>
              <span className="hidden sm:inline text-[13.5px] font-semibold text-[#0E1916]">{firstName || "Konto"}</span>
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                <div role="menu" className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_14px_40px_-16px_rgba(14,25,22,0.25)] p-2">
                  <Link href="/settings" role="menuitem" onClick={() => setUserMenuOpen(false)} className="block px-3 py-2 rounded-xl text-[13.5px] text-[#3D4A46] hover:bg-[#F6F3EC]">
                    Einstellungen
                  </Link>
                  <a href="/" target="_blank" rel="noopener" role="menuitem" className="block px-3 py-2 rounded-xl text-[13.5px] text-[#3D4A46] hover:bg-[#F6F3EC]">
                    Zur Halo-Webseite ↗
                  </a>
                  <form action="/auth/signout" method="POST">
                    <button type="submit" role="menuitem" className="w-full text-left px-3 py-2 rounded-xl text-[13.5px] text-[#3D4A46] hover:bg-[#F6F3EC]">
                      Abmelden
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── Icon-Leiste (Desktop) ─── */}
        <aside className="hidden md:flex w-14 flex-shrink-0 flex-col items-center gap-2 pt-4 pb-4">
          {rail.map(group => (
            <div key={group.label}>{renderGroup(group)}</div>
          ))}
          <div className="mt-auto">
            {renderGroup(SETTINGS_GROUP)}
          </div>
        </aside>

        {/* ─── Drawer (mobil) ─── */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
            <aside className="relative w-[270px] max-w-[85%] bg-white flex flex-col h-full">
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                {brand}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Menü schließen"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5E6563] hover:bg-[#F3EFE6]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
              {drawerNav}
            </aside>
          </div>
        )}

        {/* ─── Abgesetzter Hauptbereich ─── */}
        <div className="flex flex-1 overflow-hidden bg-[#FAF8F3] md:border md:border-b-0 md:border-r-0 md:border-[#E9E1D3] md:rounded-tl-3xl">

          {panelContent !== undefined && (
            <div className="hidden lg:flex w-[300px] flex-shrink-0 bg-white border-r border-[#E9E1D3] flex-col overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#E9E1D3] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0E1916]">{panelHeader}</span>
                {panelCount && (
                  <span className="text-xs text-[#C8431F] bg-[#FDE7E0] px-2 py-0.5 rounded-full">{panelCount}</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">{panelContent}</div>
              {panelFooter && <div className="border-t border-[#E9E1D3]">{panelFooter}</div>}
            </div>
          )}

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}
