/**
 * Zentrale Einstellungen für Messung und Limits.
 *
 * Das Preismodell kommt später; bis dahin gelten diese Werte für alle Konten.
 * Tarifabhängige Limits werden hier ergänzt, nicht in Seiten oder Routen.
 */

import { ALL_PROVIDERS, type LLMProvider } from "../auralis/providers"
import type { MeasurementProfile } from "../auralis/runner"

/** Messdesign je Thema: 7 Fragen (Standard-Matrix) × 2 Runden je Modell. */
export const MEASUREMENT: MeasurementProfile = { depth: "standard", rounds: 2 }

/** Alle Modelle mit gesetztem API-Schlüssel. */
export function measurementProviders(): LLMProvider[] {
  return ALL_PROVIDERS.filter(p => p.isConfigured())
}

export const LIMITS = {
  /** Themen je Person. */
  topicsPerPerson: 5,
  /** Personen je Team-Konto (null = unbegrenzt). */
  personsPerTeam: null as number | null,
  /** Öffentliche API: Abfragen je Konto und Tag (null = unbegrenzt). */
  apiRequestsPerDay: 1000 as number | null,
  /** Aktive API-Schlüssel je Konto. */
  apiKeysPerAccount: 5,
}
