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
}

/**
 * SEO-Dimension (klassische Google-Suche). Bewusst eine eigene Farbfamilie
 * (Bernstein/Orange), damit „GEO = KI-Suche" und „SEO = Google-Suche" optisch
 * klar getrennt sind. SEO ist KEIN ScoreKey (eigene Pipeline, eigene Tabelle),
 * deshalb als Standalone-Theme statt im DIMENSION_THEME-Record.
 */
export const SEO_THEME: DimensionTheme = {
  bg: "#FBF0DE", track: "#F6D79B", accent: "#E08A1E", text: "#5C3A06", label: "#8A5A0E",
}

export const DIMENSION_THEME: Record<ScoreKey, DimensionTheme> = {
  "aura": {
    bg: "#FDE7E0", track: "#FBCBB8", accent: "#FA5935", text: "#0E1916", label: "#C8431F",
  },
  "geo": {
    bg: "#E6F1FB", track: "#B5D4F4", accent: "#378ADD", text: "#0C447C", label: "#185FA5",
  },
  "thought-leadership": {
    bg: "#E9F0F0", track: "#C7D9D9", accent: "#6D8C8D", text: "#1C2A2A", label: "#4C6667",
  },
  "digital-authority": {
    bg: "#E1F5EE", track: "#9FE1CB", accent: "#1D9E75", text: "#04342C", label: "#0F6E56",
  },
}
