"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

const NAV = [
  { href: "/dashboard",                  label: "Overview",        icon: "overview" },
  { href: "/dashboard/ai-visibility",    label: "AI Visibility",   icon: "visibility" },
  { href: "/dashboard/topics",           label: "Topic Ownership", icon: "topics" },
  { href: "/dashboard/recommendations",  label: "Recommendations", icon: "recommendations" },
  { href: "/settings",                   label: "Settings",        icon: "settings" },
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
  settings: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.1 1.1M11 11l1.1 1.1M2.9 12.1l1.1-1.1M11 4l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
}

interface Props {
  userName?: string
  panelHeader?: string
  panelCount?: string
  panelContent?: ReactNode
  panelFooter?: ReactNode
  children: ReactNode
}

export default function DashboardShell({
  userName = "",
  panelHeader = "Topics",
  panelCount,
  panelContent,
  panelFooter,
  children,
}: Props) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-[#0a0c10] text-white overflow-hidden">

      {/* ─── Sidebar ─── */}
      <aside className="w-[220px] flex-shrink-0 bg-[#0f1117] border-r border-white/[0.06] flex flex-col">
        <div className="px-5 py-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-gradient-radial from-amber-400 to-amber-800 flex-shrink-0"/>
            <span className="text-amber-400 font-light tracking-widest text-xs uppercase">Auralis</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-amber-400/10 text-amber-400"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]"
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

        <div className="px-5 py-4 border-t border-white/[0.04] space-y-2">
          {userName && <p className="text-xs text-neutral-600 truncate">{userName}</p>}
          <form action="/auth/signout" method="POST">
            <button type="submit" className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors">
              Sign out →
            </button>
          </form>
        </div>
      </aside>

      {/* ─── Panel column ─── */}
      {panelContent !== undefined && (
        <div className="w-[280px] flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
          <div className="px-4 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <span className="text-sm text-neutral-300 font-medium">{panelHeader}</span>
            {panelCount && <span className="text-xs text-neutral-600">{panelCount}</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {panelContent}
          </div>
          {panelFooter && (
            <div className="border-t border-white/[0.04]">
              {panelFooter}
            </div>
          )}
        </div>
      )}

      {/* ─── Main content ─── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
