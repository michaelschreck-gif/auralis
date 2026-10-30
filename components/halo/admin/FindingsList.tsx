import Link from "next/link"
import type { Finding, Severity } from "@/lib/halo/account-checks"

export const SEVERITY_LABEL: Record<Severity, string> = { error: "Fehler", warning: "Warnung", info: "Hinweis" }

const STYLE: Record<Severity, string> = {
  error: "bg-[#FDE7E0] text-[#C8431F]",
  warning: "bg-[#FFF4DC] text-[#8A5A00]",
  info: "bg-[#F0EAE0] text-[#6B625A]",
}

/** Liste von Check-Befunden mit Links zum betroffenen Nutzer bzw. Konto. */
export default function FindingsList({ findings, links = true }: { findings: Finding[]; links?: boolean }) {
  if (findings.length === 0) return <p className="text-sm text-[#1F6B3A]">Keine Auffälligkeiten.</p>
  return (
    <ul className="divide-y divide-[#F0EAE0]">
      {findings.map((f, i) => (
        <li key={`${f.code}-${f.userId ?? ""}-${f.accountId ?? ""}-${f.personId ?? ""}-${i}`} className="py-2.5 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3">
          <span className={`shrink-0 w-20 text-center text-[11px] rounded-full px-2 py-0.5 ${STYLE[f.severity]}`}>{SEVERITY_LABEL[f.severity]}</span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm text-[#0E1916]">{f.title}</span>
            <span className="block text-xs text-[#6B625A]">{f.detail}</span>
          </div>
          {links && (
            <span className="shrink-0 flex gap-3 text-xs">
              {f.userId && <Link href={`/admin/nutzer/${f.userId}`} className="text-[#C8431F] hover:underline">Nutzer</Link>}
              {f.accountId && <Link href={`/admin/konten/${f.accountId}`} className="text-[#C8431F] hover:underline">Konto</Link>}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
