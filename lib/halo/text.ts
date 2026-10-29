/**
 * Textauswertung für die Detailseiten (reine Funktionen, keine Imports).
 */

/** Domain einer URL ohne „www.“, null bei ungültiger URL. */
export function domainOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

/** Alle http(s)-URLs in einem Text (ohne angehängte Satzzeichen). */
export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)\]>"']+/g) ?? []
  return matches.map(u => u.replace(/[.,;:!?]+$/, ""))
}

export type SourceCount = { domain: string; count: number; answers: number }

/**
 * Welche Domains in den KI-Antworten zitiert werden: Gesamtnennungen und in
 * wie vielen Antworten. Sortiert nach Antworten, dann Nennungen.
 */
export function countSourceDomains(responses: string[]): SourceCount[] {
  const total = new Map<string, number>()
  const inAnswers = new Map<string, number>()
  for (const r of responses) {
    const seen = new Set<string>()
    for (const url of extractUrls(r)) {
      const d = domainOf(url)
      if (!d) continue
      total.set(d, (total.get(d) ?? 0) + 1)
      seen.add(d)
    }
    for (const d of seen) inAnswers.set(d, (inAnswers.get(d) ?? 0) + 1)
  }
  return [...total.entries()]
    .map(([domain, count]) => ({ domain, count, answers: inAnswers.get(domain) ?? 0 }))
    .sort((a, b) => b.answers - a.answers || b.count - a.count || a.domain.localeCompare(b.domain))
}

export type TextSegment = { text: string; match: boolean }

/**
 * Zerlegt einen Text so, dass Vor- + Nachname (und der Nachname allein, wenn
 * er mindestens 3 Zeichen hat) als ganze Wörter markiert sind – wie die
 * Erkennung im Analyzer.
 */
export function highlightName(text: string, firstName: string, lastName: string): TextSegment[] {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = [`${firstName} ${lastName}`.trim()]
  if (lastName.trim().length >= 3) parts.push(lastName.trim())
  const alternatives = parts.filter(Boolean).map(esc).join("|")
  if (!alternatives) return [{ text, match: false }]
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${alternatives})(?![\\p{L}\\p{N}])`, "giu")

  const out: TextSegment[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0
    if (i > last) out.push({ text: text.slice(last, i), match: false })
    out.push({ text: m[0], match: true })
    last = i + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false })
  return out.length ? out : [{ text, match: false }]
}
