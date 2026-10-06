// lib/auralis/calibration.ts
// Kalibrierung der Messmethode mit Kontrollpersonen.
//
// Idee: Wir messen regelmäßig mit EXAKT denselben Fragen (fester Seed) ein
// kleines Panel:
//   - positive Kontrollen: bekannte Personen, die bei ihrem Thema sichtbar
//     sein MÜSSEN → fällt ihr Wert stark, hat sich Modell/Methode verändert
//   - negative Kontrollen: erfundene Namen, die NIE sichtbar sein dürfen →
//     steigt ihr Wert, haben wir ein Namens-Matching-Problem (Fehlalarme,
//     vgl. „Maud-Schock"-Bug)
// Änderungen eines Kunden-Scores lassen sich so von Änderungen der KI-Modelle
// unterscheiden.
//
// Reine Funktionen/Daten, keine Imports.

export type ControlKind = "positive" | "negative"

export type CalibrationEntry = {
  key: string
  kind: ControlKind
  personName: string
  topic: string
  language: "de" | "en"
  /** Markt, in dem gemessen wird (siehe markets.ts). */
  market: "dach" | "global"
}

export const CALIBRATION_PANEL: CalibrationEntry[] = [
  { key: "pos-sinek-en",      kind: "positive", personName: "Simon Sinek",      topic: "Leadership",              language: "en", market: "global" },
  { key: "pos-ng-en",         kind: "positive", personName: "Andrew Ng",        topic: "Artificial Intelligence", language: "en", market: "global" },
  { key: "pos-neubauer-de",   kind: "positive", personName: "Luisa Neubauer",   topic: "Klimaschutz",             language: "de", market: "dach" },
  { key: "pos-dueck-de",      kind: "positive", personName: "Gunter Dueck",     topic: "Digitale Transformation", language: "de", market: "dach" },
  { key: "neg-hollenbeck-en", kind: "negative", personName: "Marcus Hollenbeck-Varga", topic: "Leadership",       language: "en", market: "global" },
  { key: "neg-dallmeier-de",  kind: "negative", personName: "Henrike Dallmeier-Voss",  topic: "Klimaschutz",      language: "de", market: "dach" },
  // Themenwort im Namen: provoziert genau den Fehlalarm-Typ des Namens-Matchings.
  { key: "neg-keyword-en",    kind: "negative", personName: "Tilda Leadership-Brandt", topic: "Leadership",       language: "en", market: "global" },
]

/** Seed bleibt fix → identische Fragen bei jedem Lauf (reine Instrumenten-Messung). */
export function calibrationSeed(key: string): string {
  return `calibration-v1-${key}`
}

export const POSITIVE_MIN_SCORE = 35
export const NEGATIVE_MAX_SCORE = 5
export const DRIFT_THRESHOLD = 15

export type CalibrationFlag = "positive_control_low" | "negative_control_hit" | "drift"

export type CalibrationVerdict = {
  flag: CalibrationFlag | null
  detail: string
}

export function evaluateCalibration(
  entry: Pick<CalibrationEntry, "kind" | "personName">,
  score: number,
  previousScore: number | null,
): CalibrationVerdict {
  if (entry.kind === "negative" && score > NEGATIVE_MAX_SCORE) {
    return {
      flag: "negative_control_hit",
      detail: `Erfundener Name „${entry.personName}" erreicht ${score} (Soll ≤ ${NEGATIVE_MAX_SCORE}) – mögliches Namens-Matching-Problem.`,
    }
  }
  if (entry.kind === "positive" && score < POSITIVE_MIN_SCORE) {
    return {
      flag: "positive_control_low",
      detail: `Bekannte Person „${entry.personName}" erreicht nur ${score} (Soll ≥ ${POSITIVE_MIN_SCORE}) – Modell- oder Methodenänderung prüfen.`,
    }
  }
  if (previousScore !== null && Math.abs(score - previousScore) >= DRIFT_THRESHOLD) {
    return {
      flag: "drift",
      detail: `„${entry.personName}": ${previousScore} → ${score} seit dem letzten Lauf (Δ ≥ ${DRIFT_THRESHOLD}).`,
    }
  }
  return { flag: null, detail: "ok" }
}

/** Die `count` am längsten nicht gemessenen Panel-Einträge (nie gemessene zuerst). */
export function pickStalestEntries(
  lastMeasuredAt: Record<string, string | undefined>,
  count: number,
  panel: CalibrationEntry[] = CALIBRATION_PANEL,
): CalibrationEntry[] {
  const ts = (e: CalibrationEntry) => {
    const v = lastMeasuredAt[e.key]
    return v ? new Date(v).getTime() : 0
  }
  return [...panel].sort((a, b) => ts(a) - ts(b)).slice(0, count)
}
