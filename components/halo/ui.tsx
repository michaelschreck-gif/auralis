import Link from "next/link"
import { Spotlight } from "./motion"

/**
 * Gemeinsame Bausteine der Personen-Seiten.
 * Farben laufen über die --h-Variablen (app/globals.css): hell außerhalb,
 * dunkel innerhalb von <HaloDark>. Die Klassen h-card / h-btn wirken nur im Dunklen.
 */

/** Rahmen für den Kundenbereich: dunkles Design der Startseite + Lichtkante auf Karten. */
export function HaloDark({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`halo-dark ${className}`}>
      <Spotlight />
      {children}
    </div>
  )
}

export const card = "h-card rounded-2xl border border-[var(--h-line)] bg-[var(--h-card)]"

export function PageHeader({ eyebrow, title, text, action }: { eyebrow?: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        {eyebrow && <span className="h-eyebrow text-xs font-semibold uppercase tracking-wider text-[#FA5935]">{eyebrow}</span>}
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-[2.6rem] text-[var(--h-text)] mt-2">{title}</h1>
        {text && <p className="text-sm text-[var(--h-muted)] mt-2 max-w-2xl leading-relaxed">{text}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className={`${card} p-8 md:p-10 text-center`}>
      <h2 className="h-display font-[family-name:var(--font-display)] text-xl md:text-2xl text-[var(--h-text)]">{title}</h2>
      <p className="text-sm text-[var(--h-muted)] mt-2 max-w-md mx-auto leading-relaxed">{text}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export function Tabs({ base, current, tabs }: { base: string; current: string; tabs: { id: string; label: string }[] }) {
  return (
    <nav className="flex gap-1 border-b border-[var(--h-line)] overflow-x-auto overflow-y-hidden [scrollbar-width:none]" aria-label="Bereiche">
      {tabs.map(t => (
        <Link
          key={t.id}
          href={`${base}?tab=${t.id}`}
          aria-current={t.id === current ? "page" : undefined}
          className={`px-3.5 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
            t.id === current ? "border-[#FA5935] text-[var(--h-text)] font-medium" : "border-transparent text-[var(--h-muted)] hover:text-[var(--h-text)]"
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
    <span className="text-sm text-[var(--h-dim)]">{muted}</span>
  ) : (
    <span className="text-lg font-semibold tabular-nums text-[var(--h-text)]">{value}</span>
  )
}

export function formatDate(iso: string | null): string {
  if (!iso) return "–"
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export const primaryBtn =
  "h-btn h-btn--primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-60"
export const secondaryBtn =
  "h-btn h-btn--ghost inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-[var(--h-line)] text-[var(--h-text)] hover:border-[#FA5935] transition-colors disabled:opacity-60"
export const inputCls =
  "w-full bg-[var(--h-input)] border border-[var(--h-line)] rounded-lg px-3 py-2 text-sm text-[var(--h-text)] placeholder-[var(--h-dim)] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20 transition-colors"
