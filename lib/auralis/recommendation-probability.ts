// lib/auralis/recommendation-probability.ts
//
// Recommendation Probability — „Wirst du empfohlen, wenn jemand KI nach einem
// Speaker / Berater / Trainer / Podcast-Gast für dein Thema fragt?"
//
// Wir stellen KI gezielte Rollen-Empfehlungsfragen (mehrere Phrasierungen pro
// Rolle × Thema) und messen die Trefferquote: in wie viel Prozent der Fälle wird
// die Person genannt. Das ist die direkt umsatzrelevante Frage für Speaker,
// Berater und Trainer.
//
// Diese Datei ist logik-only (keine Next/Supabase-Imports) → testbar + im
// Runner/Route wiederverwendbar.

export type RecRoleId = "keynote" | "consultant" | "trainer" | "podcast"

export type RecRoleDefinition = {
  id: RecRoleId
  /** Deutsches UI-Label. */
  label: string
  /** Kurze Erklärung fürs UI. */
  hint: string
}

/** Die 4 abgefragten Rollen (Auswahl des Owners). */
export const ROLE_DEFINITIONS: RecRoleDefinition[] = [
  { id: "keynote", label: "Keynote-Speaker", hint: "Wirst du als Speaker für Bühnen empfohlen?" },
  { id: "consultant", label: "Berater / Consultant", hint: "Wirst du als Berater empfohlen?" },
  { id: "trainer", label: "Trainer / Coach", hint: "Wirst du als Trainer/Coach empfohlen?" },
  { id: "podcast", label: "Podcast-Gast", hint: "Wirst du als Podcast-Gast vorgeschlagen?" },
]

/**
 * Liefert die Empfehlungs-Prompts für eine Rolle × Thema (mehrere Phrasierungen
 * → robustere Trefferquote). Sprache de/en.
 */
export function rolePrompts(roleId: RecRoleId, topic: string, lang: "de" | "en"): string[] {
  const t = topic.trim()
  if (lang === "en") {
    switch (roleId) {
      case "keynote":
        return [
          `Who would you recommend as a keynote speaker on ${t}? Name several people.`,
          `I'm organizing a conference about ${t} and need a keynote speaker. Who should I invite?`,
        ]
      case "consultant":
        return [
          `Which consultant or advisor for ${t} would you recommend? Name several people.`,
          `Our company needs an expert consultant on ${t}. Whom would you suggest?`,
        ]
      case "trainer":
        return [
          `Who would you recommend as a trainer or coach for ${t}? Name several people.`,
          `I want to book a workshop on ${t}. Which trainer or coach should I hire?`,
        ]
      case "podcast":
        return [
          `Which expert on ${t} would make a great podcast guest? Name several people.`,
          `I host a podcast about ${t} and want to invite a guest. Who would you suggest?`,
        ]
    }
  }
  switch (roleId) {
    case "keynote":
      return [
        `Wen würdest du als Keynote-Speaker zum Thema ${t} empfehlen? Nenne mehrere Personen.`,
        `Ich organisiere eine Konferenz zu ${t} und suche einen Keynote-Speaker. Wen sollte ich einladen?`,
      ]
    case "consultant":
      return [
        `Welchen Berater oder Consultant für ${t} würdest du empfehlen? Nenne mehrere Personen.`,
        `Unser Unternehmen braucht einen Experten-Berater für ${t}. Wen würdest du vorschlagen?`,
      ]
    case "trainer":
      return [
        `Wen würdest du als Trainer oder Coach für ${t} empfehlen? Nenne mehrere Personen.`,
        `Ich möchte einen Workshop zu ${t} buchen. Welchen Trainer oder Coach sollte ich engagieren?`,
      ]
    case "podcast":
      return [
        `Welcher Experte für ${t} wäre ein guter Podcast-Gast? Nenne mehrere Personen.`,
        `Ich habe einen Podcast über ${t} und möchte einen Gast einladen. Wen würdest du vorschlagen?`,
      ]
  }
}

export type RoleSample = { mentioned: boolean; position: number | null }

export type RoleProbability = {
  roleId: RecRoleId
  label: string
  hint: string
  /** 0–100, Anteil der Abfragen mit Nennung. */
  probability: number
  /** Anzahl Treffer. */
  mentions: number
  /** Anzahl Abfragen. */
  samples: number
  /** Beste Listenposition über alle Treffer (1 = bester). null = nie genannt. */
  bestPosition: number | null
}

/** Aggregiert die Roh-Treffer einer Rolle zu einer Wahrscheinlichkeit. */
export function computeRoleProbability(
  role: RecRoleDefinition,
  samples: RoleSample[],
): RoleProbability {
  const mentions = samples.filter(s => s.mentioned).length
  const positions = samples
    .map(s => s.position)
    .filter((p): p is number => p !== null)
  return {
    roleId: role.id,
    label: role.label,
    hint: role.hint,
    probability: samples.length > 0 ? Math.round((mentions / samples.length) * 100) : 0,
    mentions,
    samples: samples.length,
    bestPosition: positions.length > 0 ? Math.min(...positions) : null,
  }
}

export type ProbabilityBand = { label: string; min: number; color: string }

export const PROBABILITY_BANDS: ProbabilityBand[] = [
  { label: "Erste Wahl", min: 75, color: "#22A06B" },
  { label: "Im Kandidatenkreis", min: 45, color: "#7F77DD" },
  { label: "Selten empfohlen", min: 20, color: "#EF9F27" },
  { label: "Nicht auf dem Schirm", min: 0, color: "#D1495B" },
]

export function probabilityBand(p: number): ProbabilityBand {
  return PROBABILITY_BANDS.find(b => p >= b.min) ?? PROBABILITY_BANDS[PROBABILITY_BANDS.length - 1]
}

/** Gesamt-Wahrscheinlichkeit = Mittel über die Rollen-Wahrscheinlichkeiten. */
export function overallProbability(roles: RoleProbability[]): number {
  if (roles.length === 0) return 0
  return Math.round(roles.reduce((a, r) => a + r.probability, 0) / roles.length)
}
