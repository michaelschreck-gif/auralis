/**
 * Unternehmen in KI-Antworten: Nennt die KI das Unternehmen einer Person – und
 * nennt sie es zusammen mit der Person? So wird sichtbar, ob die Reputation
 * einer Person (Corporate Ambassador) auf die Unternehmensmarke abstrahlt.
 * Reine Funktionen, keine Datenbank.
 */

/** Rechtsformen am Ende, die in KI-Antworten meist fehlen („Halo GmbH“ → „Halo“). */
const LEGAL_FORMS = [
  "gmbh & co\\. kg", "gmbh & co kg", "ug \\(haftungsbeschränkt\\)", "ug", "gmbh", "ag", "se", "kg", "ohg", "gbr", "e\\.v\\.", "ev", "eg",
  "mbh", "ltd\\.?", "limited", "inc\\.?", "llc", "plc", "corp\\.?", "co\\.", "sarl", "s\\.a\\.r\\.l\\.", "sas", "s\\.a\\.", "sa", "bv", "b\\.v\\.", "nv",
]
const LEGAL_SUFFIX = new RegExp(`[\\s,]+(?:${LEGAL_FORMS.join("|")})\\s*$`, "iu")

/** Firmenname ohne Rechtsform und überflüssige Leerzeichen; leer, wenn nichts Brauchbares übrig bleibt. */
export function normalizeCompany(raw: string | null | undefined): string {
  let name = (raw ?? "").replace(/\s+/g, " ").trim()
  for (let i = 0; i < 3; i++) {
    const next = name.replace(LEGAL_SUFFIX, "").trim()
    if (next === name) break
    name = next
  }
  // Ein- oder Zwei-Zeichen-Namen würden in fast jeder Antwort „gefunden“.
  return name.length >= 3 ? name : ""
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Kommt der (normalisierte) Firmenname als ganzes Wort im Text vor? Groß-/Kleinschreibung egal. */
export function mentionsCompany(text: string, company: string): boolean {
  const name = normalizeCompany(company)
  if (!name || !text) return false
  const pattern = escapeRegExp(name.toLowerCase()).replace(/\s+/g, "\\s+")
  return new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, "u").test(text.toLowerCase())
}

export type CompanyMentions = {
  company: string
  /** Antworten insgesamt */
  answers: number
  /** Antworten, die das Unternehmen nennen */
  companyMentioned: number
  /** Antworten, die die Person nennen */
  personMentioned: number
  /** Antworten, die Person und Unternehmen gemeinsam nennen */
  together: number
}

/** Zählt Nennungen des Unternehmens in den Antworten einer Messung. */
export function companyMentionStats(
  answers: { text: string; personMentioned: boolean }[],
  company: string,
): CompanyMentions | null {
  const name = normalizeCompany(company)
  if (!name || answers.length === 0) return null
  let companyMentioned = 0
  let personMentioned = 0
  let together = 0
  for (const a of answers) {
    const c = mentionsCompany(a.text, name)
    if (c) companyMentioned++
    if (a.personMentioned) personMentioned++
    if (c && a.personMentioned) together++
  }
  return { company: name, answers: answers.length, companyMentioned, personMentioned, together }
}

/** Mehrere Messungen (z. B. je Thema) zusammenzählen. */
export function sumCompanyMentions(list: (CompanyMentions | null | undefined)[]): CompanyMentions | null {
  const valid = list.filter((x): x is CompanyMentions => !!x && typeof x.answers === "number")
  if (valid.length === 0) return null
  return valid.reduce((acc, x) => ({
    company: acc.company,
    answers: acc.answers + x.answers,
    companyMentioned: acc.companyMentioned + x.companyMentioned,
    personMentioned: acc.personMentioned + x.personMentioned,
    together: acc.together + x.together,
  }))
}

/** Anteil in Prozent, gerundet; 0 bei leerer Basis. */
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}
