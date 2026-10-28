import Link from "next/link"

/** true, wenn die Analyse zu keinem der aktuell beobachteten Themen passt. */
export function isReportStale(reportTopics: string[] | null | undefined, activeTopics: string[]): boolean {
  const active = activeTopics.map(t => t.trim().toLowerCase()).filter(Boolean)
  const report = (reportTopics ?? []).map(t => t.trim().toLowerCase()).filter(Boolean)
  if (active.length === 0 || report.length === 0) return false
  return !report.some(t => active.includes(t))
}

/**
 * Hinweis, wenn die angezeigte (jüngste) Analyse zu einem Thema gehört, das
 * nicht mehr beobachtet wird — z. B. nach einer Themen-Änderung im Setup.
 * Verhindert, dass alte Daten (anderes Thema) wie aktuelle wirken.
 */
export default function StaleReportNotice({ reportTopics, activeTopics }: { reportTopics: string[]; activeTopics: string[] }) {
  if (!isReportStale(reportTopics, activeTopics)) return null
  return (
    <div role="status" className="rounded-2xl border border-[#F2C94C] bg-[#FFF8E1] p-4 text-sm text-[#5C4A12] leading-relaxed">
      <strong className="text-[#0E1916]">Diese Daten gehören zu einem alten Thema.</strong>{" "}
      Die letzte Analyse lief zu „{reportTopics.join(", ")}“. Du beobachtest inzwischen „{activeTopics.join(", ")}“.{" "}
      <Link href="/dashboard/analyze" className="font-semibold text-[#C8431F] hover:underline">
        Jetzt neue Analyse starten →
      </Link>
    </div>
  )
}
