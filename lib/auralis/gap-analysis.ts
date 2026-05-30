// lib/auralis/gap-analysis.ts
// Vergleicht die eigene Sichtbarkeit mit der eines Wettbewerbers — pro
// Abfrage-Archetyp. Liefert Lücken (Wettbewerber genannt, du nicht) und
// Vorsprünge (du genannt, Wettbewerber nicht).

import type { VisibilityReport } from "./analyzer"

/** Deutschsprachige Labels je Query-Archetyp (queryType aus queries.ts). */
export const QUERY_TYPE_LABELS: Record<string, string> = {
  expert_discovery: "Experten-Suche",
  topic_authority: "Themen-Autorität",
  recommendation: "Empfehlungen",
  comparison: "Direktvergleich",
  leadership: "Gründer & CEOs",
  popular_figures: "Bekannte Persönlichkeiten",
}

/** Kurze Erklärung, was der Archetyp misst. */
export const QUERY_TYPE_HINTS: Record<string, string> = {
  expert_discovery: "Wer gilt als führende Expertin/Experte für das Thema?",
  topic_authority: "Wer spricht am glaubwürdigsten über das Thema?",
  recommendation: "Wem soll man folgen / wen empfehlen?",
  comparison: "Direkter Vergleich relevanter Personen.",
  leadership: "Wer sind die Gründer, CEOs und Pioniere des Felds?",
  popular_figures: "Welche bekannten Persönlichkeiten prägen das Thema?",
}

export type ArchetypeComparison = {
  type: string
  label: string
  hint: string
  selfMentioned: boolean
  competitorMentioned: boolean
  /** "gap" = Wettbewerber vorne, "advantage" = du vorne, "tie" = gleich. */
  verdict: "gap" | "advantage" | "tie"
}

export type GapAnalysis = {
  competitorName: string
  comparisons: ArchetypeComparison[]
  gapCount: number
  advantageCount: number
}

/** Gibt true zurück, wenn die Person in mindestens einem Result dieses Typs genannt wurde. */
function mentionedInType(report: VisibilityReport, type: string): boolean {
  return report.queryResults.some(
    qr => qr.queryType === type && qr.signal?.mentioned,
  )
}

/** Alle Query-Typen, die in einem der beiden Reports vorkommen (stabile Reihenfolge). */
const TYPE_ORDER = [
  "expert_discovery",
  "topic_authority",
  "recommendation",
  "comparison",
  "leadership",
  "popular_figures",
]

export function computeGapAnalysis(
  self: VisibilityReport,
  competitor: VisibilityReport,
  competitorName: string,
): GapAnalysis {
  const typesPresent = new Set<string>()
  ;[...self.queryResults, ...competitor.queryResults].forEach(qr => {
    if (qr.queryType) typesPresent.add(qr.queryType)
  })

  const orderedTypes = [
    ...TYPE_ORDER.filter(t => typesPresent.has(t)),
    ...Array.from(typesPresent).filter(t => !TYPE_ORDER.includes(t)),
  ]

  const comparisons: ArchetypeComparison[] = orderedTypes.map(type => {
    const selfMentioned = mentionedInType(self, type)
    const competitorMentioned = mentionedInType(competitor, type)
    let verdict: ArchetypeComparison["verdict"] = "tie"
    if (competitorMentioned && !selfMentioned) verdict = "gap"
    else if (selfMentioned && !competitorMentioned) verdict = "advantage"
    return {
      type,
      label: QUERY_TYPE_LABELS[type] ?? type,
      hint: QUERY_TYPE_HINTS[type] ?? "",
      selfMentioned,
      competitorMentioned,
      verdict,
    }
  })

  return {
    competitorName,
    comparisons,
    gapCount: comparisons.filter(c => c.verdict === "gap").length,
    advantageCount: comparisons.filter(c => c.verdict === "advantage").length,
  }
}
