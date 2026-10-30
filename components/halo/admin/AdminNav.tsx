"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/konten", label: "Konten" },
  { href: "/admin/nutzer", label: "Nutzer" },
  { href: "/admin/audit", label: "Audit-Log" },
  { href: "/admin/calibration", label: "Kalibrierung" },
  { href: "/admin/pruefset", label: "Prüfset" },
]

export default function AdminNav() {
  const pathname = usePathname()
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))
  return (
    <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none]" aria-label="Admin">
      {ITEMS.map(i => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={active(i.href) ? "page" : undefined}
          className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${active(i.href) ? "bg-[#FA5935] text-white" : "text-[#D9D2C7] hover:text-white"}`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
