import Link from "next/link"

/** Gemeinsame Bausteine der Personen-Seiten. */

export const card = "rounded-2xl border border-[#E9E1D3] bg-white"

export function PageHeader({ eyebrow, title, text, action }: { eyebrow?: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        {eyebrow && <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">{eyebrow}</span>}
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916] mt-1">{title}</h1>
        {text && <p className="text-sm text-[#6B625A] mt-1 max-w-2xl">{text}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className={`${card} p-8 text-center`}>
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[#0E1916]">{title}</h2>
      <p className="text-sm text-[#6B625A] mt-2 max-w-md mx-auto">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

export function Tabs({ base, current, tabs }: { base: string; current: string; tabs: { id: string; label: string }[] }) {
  return (
    <nav className="flex gap-1 border-b border-[#E9E1D3] overflow-x-auto overflow-y-hidden [scrollbar-width:none]" aria-label="Bereiche">
      {tabs.map(t => (
        <Link
          key={t.id}
          href={`${base}?tab=${t.id}`}
          aria-current={t.id === current ? "page" : undefined}
          className={`px-3.5 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
            t.id === current ? "border-[#FA5935] text-[#0E1916] font-medium" : "border-transparent text-[#6B625A] hover:text-[#0E1916]"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

export function Score({ value, muted = "–" }: { value: number | null; muted?: string }) {
  return value === null ? (
    <span className="text-sm text-[#9A9089]">{muted}</span>
  ) : (
    <span className="text-lg font-semibold tabular-nums text-[#0E1916]">{value}</span>
  )
}

export function formatDate(iso: string | null): string {
  if (!iso) return "–"
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export const primaryBtn =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-60"
export const secondaryBtn =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] text-[#0E1916] hover:border-[#FA5935] transition-colors disabled:opacity-60"
export const inputCls =
  "w-full bg-white border border-[#E9E1D3] rounded-lg px-3 py-2 text-sm text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
