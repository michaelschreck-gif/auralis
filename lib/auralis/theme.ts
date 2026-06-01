// lib/auralis/theme.ts
// Zentrale Farbwelt für das Bold-&-farbig-Redesign. Jede Score-Dimension hat
// eine feste Farbfamilie, die sich konsistent durch ALLE Seiten zieht
// (Cockpit, Detailseiten, KI-Sichtbarkeit …). So entsteht Wiedererkennung:
// GEO ist immer blau, Thought Leadership immer lila, Digitale Autorität grün.

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

/** Master-Aura: dunkles Lila als Markenfarbe (Hero). */
export const AURA_THEME = {
  bg: "#26215C",
  accent: "#7F77DD",
  accentText: "#26215C",
  light: "#CECBF6",
}

export const DIMENSION_THEME: Record<ScoreKey, DimensionTheme> = {
  "aura": {
    bg: "#EEEDFE", track: "#CECBF6", accent: "#7F77DD", text: "#26215C", label: "#534AB7",
  },
  "geo": {
    bg: "#E6F1FB", track: "#B5D4F4", accent: "#378ADD", text: "#0C447C", label: "#185FA5",
  },
  "thought-leadership": {
    bg: "#EEEDFE", track: "#CECBF6", accent: "#7F77DD", text: "#26215C", label: "#534AB7",
  },
  "digital-authority": {
    bg: "#E1F5EE", track: "#9FE1CB", accent: "#1D9E75", text: "#04342C", label: "#0F6E56",
  },
}
