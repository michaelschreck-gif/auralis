// lib/auralis/model-weights.ts
// Gewichtung der KI-Modelle im Gesamtscore.
//
// Nicht jedes Modell erreicht gleich viele Menschen. Statt eines gleich
// gewichteten Mittels zählen die Modelle daher nach geschätzter Reichweite.
// WICHTIG: Die Zahlen sind eine Annahme (Größenordnung der Nutzung), keine
// gemessenen Marktanteile – bei Bedarf hier anpassen. Fällt ein Modell aus,
// werden die übrigen automatisch auf 100 % normalisiert.
//
// Reine Funktionen, keine Imports.

export const PROVIDER_WEIGHTS: Record<string, number> = {
  "gpt-4o": 0.35,
  "gemini-flash": 0.25,
  "claude-sonnet": 0.2,
  "perplexity-sonar": 0.2,
}

const FALLBACK_WEIGHT = 0.1

/** Normalisierte Gewichte (Summe 1) in der Reihenfolge der übergebenen IDs. */
export function normalizedWeights(ids: string[]): number[] {
  if (ids.length === 0) return []
  const raw = ids.map(id => PROVIDER_WEIGHTS[id] ?? FALLBACK_WEIGHT)
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map(w => w / sum)
}

/** Gewichteter Mittelwert; Gewichte müssen nicht normalisiert sein. */
export function weightedMean(values: number[], weights: number[]): number {
  if (values.length === 0) return 0
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return values.reduce((a, b) => a + b, 0) / values.length
  return values.reduce((acc, v, i) => acc + v * weights[i], 0) / sum
}
