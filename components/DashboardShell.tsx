"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

const NAV = [
  { href: "/dashboard",                 label: "Overview",        icon: "overview" },
  { href: "/dashboard/ai-visibility",   label: "AI Visibility",   icon: "visibility" },
  { href: "/dashboard/topics",          label: "Topic Ownership", icon: "topics" },
  { href: "/dashboard/recommendations", label: "Recommendations", icon: "recommendations" },
  { href: "/settings",                  label: "Settings",        icon: "settings" },
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
  const initials = userName
    ? userName.split(" ").map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2)
    : "?"
  const breadcrumb = NAV.find(n => n.href === pathname)?.label ?? "Dashboard"

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fb] overflow-hidden">

      {/* ─── Topbar ─── */}
      <header className="h-[60px] flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-6 gap-6 z-10">
        <div className="flex items-center gap-2.5 w-[240px] flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#4F6EF7] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-[#0f172a] font-semibold text-sm tracking-tight">Auralis</span>
        </div>
        <div className="flex-1">
          <span className="text-sm text-[#64748b] font-medium">{breadcrumb}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {userName && (
            <>
              <span className="text-sm text-[#64748b] hidden md:block">{userName}</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-[#4F6EF7]">{initials}</span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── Sidebar ─── */}
        <aside className="w-[240px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-blue-50 text-[#4F6EF7] font-medium"
                      : "text-[#64748b] hover:text-[#0f172a] hover:bg-gray-50"
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

          <div className="px-5 py-4 border-t border-gray-100">
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="text-xs text-[#64748b] hover:text-[#0f172a] transition-colors"
              >
                Sign out →
              </button>
            </form>
          </div>
        </aside>

        {/* ─── Panel column ─── */}
        {panelContent !== undefined && (
          <div className="w-[300px] flex-shrink-0 bg-[#f8f9fb] border-r border-gray-100 flex flex-col overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
              <span className="text-sm font-semibold text-[#0f172a]">{panelHeader}</span>
              {panelCount && (
                <span className="text-xs text-[#64748b] bg-gray-100 px-2 py-0.5 rounded-full">
                  {panelCount}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {panelContent}
            </div>
            {panelFooter && (
              <div className="border-t border-gray-100">{panelFooter}</div>
            )}
          </div>
        )}

        {/* ─── Main content ─── */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}
