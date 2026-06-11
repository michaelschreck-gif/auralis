/**
 * AI Persona Profile — destilliert aus echten KI-Antworten, in welchen Rollen
 * eine Person wahrgenommen wird ("Wie KI dich sieht").
 *
 * Input: die gespeicherten query_results.response-Texte des jüngsten Reports.
 * Output: ein Ein-Satz-Summary + gewichtete Rollen-Tags.
 *
 * Nutzt Claude (claudeProvider) für die Extraktion. Crasht nie — bei Fehlern
 * oder leerem Korpus wird null zurückgegeben.
 */

import { claudeProvider } from "./providers"
import { sanitizeTargetName } from "./analyzer"

export type PersonaRole = { label: string; weight: number }
export type PersonaResult = { summary: string; roles: PersonaRole[] }

function clampWeight(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

export async function extractPersona(
  responses: string[],
  targetName: string,
): Promise<PersonaResult | null> {
  const name = sanitizeTargetName(targetName).trim()
  const corpus = responses
    .filter(Boolean)
    .slice(0, 25)
    .map((r, i) => `--- Antwort ${i + 1} ---\n${r.slice(0, 1500)}`)
    .join("\n\n")
  if (!name || !corpus.trim()) return null

  const system =
    "Du bist ein Analyst, der aus KI-Antworten extrahiert, in welchen Rollen eine Person wahrgenommen wird. Du antwortest ausschließlich mit validem JSON, ohne Erklärtext."

  const prompt = `Unten stehen echte Antworten von KI-Systemen. Extrahiere, als welche Art von Experte bzw. in welchen Rollen „${name}" darin beschrieben wird — nur belegte Rollen, keine erfundenen.

Gib NUR valides JSON in genau dieser Form zurück (keine Code-Fences, kein Text davor/danach):
{"summary":"<ein Satz auf Deutsch, wie KI die Person insgesamt wahrnimmt>","roles":[{"label":"<kurze Rolle, z.B. 'LinkedIn-Experte'>","weight":<Zahl 0-100, relative Prominenz>}]}

Regeln:
- maximal 8 Rollen
- weights grob auf 100 aufsummiert, absteigend sortiert
- wenn „${name}" kaum oder gar nicht beschrieben wird: leere roles und eine ehrliche summary.

ANTWORTEN:
${corpus}`

  let raw: string
  try {
    raw = await claudeProvider.call(prompt, system, 700)
  } catch {
    return null
  }

  const jsonText = raw.replace(/```json/gi, "").replace(/```/g, "").trim()
  const match = jsonText.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[0]) as {
      summary?: unknown
      roles?: { label?: unknown; weight?: unknown }[]
    }
    const roles: PersonaRole[] = (Array.isArray(parsed.roles) ? parsed.roles : [])
      .filter(r => typeof r?.label === "string" && String(r.label).trim())
      .map(r => ({ label: String(r.label).trim().slice(0, 60), weight: clampWeight(r.weight) }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8)
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 400) : ""
    return { summary, roles }
  } catch {
    return null
  }
}
