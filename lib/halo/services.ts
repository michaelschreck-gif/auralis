/**
 * Agentur-Leistungen von DigitalHalo: was wir für Kund:innen übernehmen,
 * um den Halo Score zu verbessern.
 *
 * Drei Arten:
 *   strategy – Gespräch/Workshop, in dem der Plan entsteht
 *   package  – Pakete mit festem Umfang über mehrere Monate
 *   single   – Einzelleistungen, gezielt für eine Säule
 *
 * Reine Daten + Funktionen, keine Datenbank. Die Empfehlung leitet sich aus
 * dem aktuellen Halo Score ab (schwächste Säule zuerst, Paket nach Band).
 * Preise stehen bewusst nicht hier – das Angebot kommt persönlich.
 */

import type { HaloScore, PillarKey } from "./score"

export type ServiceKind = "strategy" | "package" | "single"

export type Service = {
  id: string
  kind: ServiceKind
  title: string
  /** Ein Satz: was es bringt. */
  tagline: string
  /** Was konkret passiert. */
  includes: string[]
  /** Säulen, auf die die Leistung einzahlt. */
  pillars: PillarKey[]
  /** Grobe Dauer, z. B. „30 Minuten“ oder „3 Monate“. */
  duration: string
}

export const SERVICES: Service[] = [
  {
    id: "strategie-gespraech",
    kind: "strategy",
    title: "Strategie-Gespräch",
    tagline: "Wir gehen deine Messung gemeinsam durch und zeigen, wo am meisten zu holen ist.",
    includes: ["Deine Messung im Detail erklärt", "Die drei größten Hebel für deinen Score", "Klare Empfehlung für die nächsten Schritte"],
    pillars: ["ai", "google", "perception"],
    duration: "30 Minuten, kostenlos",
  },
  {
    id: "strategie-workshop",
    kind: "strategy",
    title: "Positionierungs-Workshop",
    tagline: "Wofür du stehen willst – so geschärft, dass KI und Google es verstehen.",
    includes: [
      "Themen und Kernbotschaften festlegen",
      "Abgleich mit dem Bild, das die KI heute von dir hat",
      "Fahrplan mit Maßnahmen für 90 Tage",
    ],
    pillars: ["perception", "ai"],
    duration: "halber Tag",
  },
  {
    id: "paket-start",
    kind: "package",
    title: "Halo Start",
    tagline: "Das Fundament: Damit KI-Systeme und Google dich überhaupt sicher zuordnen können.",
    includes: [
      "Profile, Website und Biografie einheitlich aufgesetzt",
      "Strukturierte Daten (Schema.org) und Wikidata-Eintrag",
      "Die fünf wichtigsten Quick Wins aus deiner Messung umgesetzt",
    ],
    pillars: ["ai", "google"],
    duration: "4 Wochen",
  },
  {
    id: "paket-aufbau",
    kind: "package",
    title: "Halo Aufbau",
    tagline: "Sichtbarkeit aufbauen: Erwähnungen in Quellen, auf die sich die KI stützt.",
    includes: [
      "Alles aus Halo Start",
      "Gastbeiträge und Interviews in Fachmedien",
      "Podcast- und Bühnen-Platzierungen",
      "LinkedIn-Content zu deinen Themen",
      "Monatlicher Bericht mit Score-Entwicklung",
    ],
    pillars: ["ai", "google", "perception"],
    duration: "3 Monate",
  },
  {
    id: "paket-dominanz",
    kind: "package",
    title: "Halo Dominanz",
    tagline: "Die erste Antwort bleiben: laufende Betreuung für alle drei Säulen.",
    includes: [
      "Fester Ansprechpartner aus der Agentur",
      "Laufende PR, Content und Platzierungen",
      "Reaktion auf Veränderungen aus dem Wochenbrief",
      "Quartals-Review mit Strategie-Update",
    ],
    pillars: ["ai", "google", "perception"],
    duration: "laufend, ab 6 Monaten",
  },
  {
    id: "geo-optimierung",
    kind: "single",
    title: "KI-Optimierung (GEO)",
    tagline: "Damit ChatGPT, Claude, Gemini und Perplexity dich bei deinen Themen nennen.",
    includes: ["Analyse, welche Quellen die Modelle zitieren", "Inhalte so aufbereitet, dass KI sie aufgreift", "Wikidata, Profile und Verzeichnisse"],
    pillars: ["ai"],
    duration: "6–8 Wochen",
  },
  {
    id: "google-sichtbarkeit",
    kind: "single",
    title: "Google & Knowledge Panel",
    tagline: "Wer dich googelt, findet dich – oben, vollständig und mit Thema.",
    includes: ["Website und Profilseiten für deinen Namen optimiert", "Knowledge Panel beantragen und pflegen", "Treffer für „Name + Thema“ aufbauen"],
    pillars: ["google"],
    duration: "6–8 Wochen",
  },
  {
    id: "pr-gastbeitraege",
    kind: "single",
    title: "PR & Gastbeiträge",
    tagline: "Erwähnungen in Medien, die KI-Systeme als Quelle nutzen.",
    includes: ["Themen und Medien passend zu deinen Zielen", "Pitches, Texte und Abstimmung mit Redaktionen", "Mindestens drei Veröffentlichungen"],
    pillars: ["ai", "perception"],
    duration: "3 Monate",
  },
  {
    id: "linkedin-content",
    kind: "single",
    title: "LinkedIn & Content",
    tagline: "Regelmäßig sichtbar mit Beiträgen, die dein Thema besetzen.",
    includes: ["Redaktionsplan zu deinen Themen", "Beiträge in deinem Ton, von uns geschrieben", "Profil geschärft"],
    pillars: ["perception", "google"],
    duration: "monatlich",
  },
  {
    id: "buehne-podcast",
    kind: "single",
    title: "Bühnen & Podcasts",
    tagline: "Auftritte, die man zitiert – und die die KI später findet.",
    includes: ["Passende Podcasts, Konferenzen und Panels", "Bewerbung und Vorbereitung", "Nachbereitung mit Clips und Texten"],
    pillars: ["ai", "perception"],
    duration: "3 Monate",
  },
]

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  strategy: "Strategie",
  package: "Paket",
  single: "Einzelleistung",
}

export function serviceById(id: string): Service | undefined {
  return SERVICES.find(s => s.id === id)
}

/** Nur bekannte IDs, ohne Doppelte, in Katalog-Reihenfolge. */
export function validServiceIds(ids: string[]): string[] {
  const wanted = new Set(ids)
  return SERVICES.filter(s => wanted.has(s.id)).map(s => s.id)
}

export type ServiceRecommendation = {
  service: Service
  /** Warum gerade das – bezogen auf die Messung. */
  reason: string
}

const PILLAR_SERVICE: Record<PillarKey, string> = {
  ai: "geo-optimierung",
  google: "google-sichtbarkeit",
  perception: "pr-gastbeitraege",
}

const PILLAR_NAME: Record<PillarKey, string> = {
  ai: "KI-Sichtbarkeit",
  google: "Google-Sichtbarkeit",
  perception: "Wahrnehmung",
}

/** Paket passend zum Band: wenig sichtbar → Fundament, mittel → Aufbau, stark → halten. */
export function packageForScore(score: number | null): Service {
  const id = score === null || score <= 25 ? "paket-start" : score <= 75 ? "paket-aufbau" : "paket-dominanz"
  return serviceById(id)!
}

/**
 * Empfehlungen aus dem aktuellen Halo Score, wichtigste zuerst:
 *   1. das passende Paket,
 *   2. Einzelleistung für die schwächste gemessene Säule,
 *   3. Einzelleistung für eine noch nicht gemessene Säule (falls vorhanden),
 *   4. immer das kostenlose Strategie-Gespräch.
 */
export function recommendServices(halo: Pick<HaloScore, "score" | "pillars">): ServiceRecommendation[] {
  const out: ServiceRecommendation[] = []
  const pkg = packageForScore(halo.score)
  out.push({
    service: pkg,
    reason:
      halo.score === null
        ? "Noch keine Messung – das Fundament lohnt sich in jedem Fall."
        : pkg.id === "paket-start"
          ? `Mit ${halo.score} bist du für KI-Systeme noch kaum sichtbar. Erst das Fundament, dann die Reichweite.`
          : pkg.id === "paket-aufbau"
            ? `Mit ${halo.score} ist die Basis da. Jetzt geht es um Erwähnungen, die dich nach vorn bringen.`
            : `Mit ${halo.score} gehörst du zu den Sichtbarsten. Damit das so bleibt, braucht es laufende Pflege.`,
  })

  const measured = halo.pillars.filter(p => p.measured && p.value !== null).sort((a, b) => (a.value ?? 0) - (b.value ?? 0))
  const weakest = measured[0]
  if (weakest && (weakest.value ?? 0) < 80) {
    out.push({
      service: serviceById(PILLAR_SERVICE[weakest.key])!,
      reason: `Deine schwächste Säule: ${PILLAR_NAME[weakest.key]} mit ${weakest.value}. Hier bringt jeder Punkt am meisten.`,
    })
  }
  const missing = halo.pillars.find(p => !p.measured)
  if (missing && PILLAR_SERVICE[missing.key] !== out[1]?.service.id) {
    out.push({
      service: serviceById(PILLAR_SERVICE[missing.key])!,
      reason: `${PILLAR_NAME[missing.key]} ist noch nicht messbar – hier fehlt die Grundlage.`,
    })
  }
  out.push({
    service: serviceById("strategie-gespraech")!,
    reason: "Kostenlos und unverbindlich: Wir zeigen dir, welche Schritte bei dir am meisten bewirken.",
  })
  return out
}
