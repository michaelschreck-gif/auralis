// lib/auralis/theme.ts
// Zentrale Farbwelt für das Bold-&-farbig-Redesign. Jede Score-Dimension hat
// eine feste Farbfamilie, die sich konsistent durch ALLE Seiten zieht
// (Cockpit, Detailseiten, KI-Sichtbarkeit …). So entsteht Wiedererkennung:
// GEO ist immer blau, Thought Leadership immer Petrol/Teal, Digitale Autorität grün.

import type { ScoreKey } from "./master-scores"

export type DimensionTheme = {
  /** Heller Karten-Hintergrund (50er Stop). */
  bg: string
  /** Track-Hintergrund für Fortschrittsbalken (100er Stop). */
  track: string
  /** Kräftige Akzentfarbe — Balken, Icons (400/600er Stop). */
  accent: string
  /** Dunkle Textfarbe auf hellem Hintergrund (800/900er Stop). */
  text: string
  /** Mittlere Textfarbe (600er Stop) für Labels. */
  label: string
}

/** Master-Aura: DigitalHalo-Coral als Markenfarbe (Hero). */
export const AURA_THEME = {
  bg: "#0E1916",
  accent: "#FA5935",
  accentText: "#0E1916",
  light: "#FBCBB8",
  /** Ringfarbe im Cockpit-Hero — exakt wie ScoreRing auf der Landingpage. */
  ring: "#F7B49B",
}

/**
 * SEO-Dimension (klassische Google-Suche). Bewusst eine eigene Farbfamilie
 * (Bernstein/Orange), damit „GEO = KI-Suche" und „SEO = Google-Suche" optisch
 * klar getrennt sind. SEO ist KEIN ScoreKey (eigene Pipeline, eigene Tabelle),
 * deshalb als Standalone-Theme statt im DIMENSION_THEME-Record.
 */
export const SEO_THEME: DimensionTheme = {
  bg: "#F6ECD9", track: "#E7CFA3", accent: "#C98A3E", text: "#6B4A1E", label: "#8A5A0E",
}

/**
 * Exakt dieselbe Palette wie DimCard auf der Landingpage (Vier-Dimensionen-Sektion),
 * damit Tool und Website als ein System wirken.
 */
export const DIMENSION_THEME: Record<ScoreKey, DimensionTheme> = {
  "aura": {
    bg: "#FDE7E0", track: "#FBCBB8", accent: "#FA5935", text: "#0E1916", label: "#C8431F",
  },
  "geo": {
    bg: "#FDE7E0", track: "#F7B49B", accent: "#FA5935", text: "#7A2A12", label: "#C8431F",
  },
  "thought-leadership": {
    bg: "#E9F0F0", track: "#C7D9D9", accent: "#6D8C8D", text: "#1C2A2A", label: "#4C6667",
  },
  "digital-authority": {
    bg: "#E7E3DC", track: "#CFCABF", accent: "#3A4442", text: "#3A4442", label: "#5A5248",
  },
}
