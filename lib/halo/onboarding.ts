/**
 * Eingaben des Assistenten prüfen und bereinigen (reine Funktionen).
 * Genutzt von der Server-Action in app/start/actions.ts und vom Formular.
 */

import type { AccountType, MarketId } from "../supabase/halo.types"

const MARKET_IDS: MarketId[] = ["dach", "us", "uk", "eu", "ca", "au", "global"]

export const MAX_TOPIC_LENGTH = 80
export const MAX_NAME_LENGTH = 60

export const TOPIC_SUGGESTIONS = [
  "Künstliche Intelligenz",
  "Digitale Transformation",
  "Leadership",
  "Personal Branding",
  "Nachhaltigkeit",
  "Vertrieb",
  "Marketing",
  "Unternehmertum",
]

function clean(s: unknown): string {
  return typeof s === "string" ? s.replace(/\s+/g, " ").trim() : ""
}

/** Themen: getrimmt, ohne Leere und Dubletten (Groß/klein egal), gekürzt, höchstens `max`. */
export function normalizeTopics(input: unknown, max: number): string[] {
  const list = Array.isArray(input) ? input : []
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    const t = clean(raw).slice(0, MAX_TOPIC_LENGTH)
    const key = t.toLowerCase()
    if (!t || seen.has(key)) continue
    seen.add(key)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

export type StartInput = {
  accountType: AccountType
  teamName: string
  firstName: string
  lastName: string
  context: string
  market: MarketId
  topics: string[]
}

export type StartValidation =
  | { ok: true; value: StartInput }
  | { ok: false; error: string }

export function validateStartInput(raw: Record<string, unknown>, maxTopics: number): StartValidation {
  const accountType = raw.accountType === "team" ? "team" : raw.accountType === "individual" ? "individual" : null
  if (!accountType) return { ok: false, error: "Bitte wähle, ob du für dich oder für ein Team misst." }

  const firstName = clean(raw.firstName).slice(0, MAX_NAME_LENGTH)
  const lastName = clean(raw.lastName).slice(0, MAX_NAME_LENGTH)
  if (!firstName || !lastName) return { ok: false, error: "Bitte gib Vor- und Nachnamen an." }

  const market = MARKET_IDS.find(m => m === raw.market)
  if (!market) return { ok: false, error: "Bitte wähle eine Region." }

  const topics = normalizeTopics(raw.topics, maxTopics)
  if (topics.length === 0) return { ok: false, error: "Bitte gib mindestens ein Thema an." }

  return {
    ok: true,
    value: {
      accountType,
      teamName: clean(raw.teamName).slice(0, MAX_NAME_LENGTH),
      firstName,
      lastName,
      context: clean(raw.context).slice(0, 120),
      market,
      topics,
    },
  }
}

/** Kontoname: Team-Name oder „Team <Nachname>“; Einzelkonto = Name der Person. */
export function accountNameFor(input: Pick<StartInput, "accountType" | "teamName" | "firstName" | "lastName">): string {
  if (input.accountType === "team") return input.teamName || `Team ${input.lastName}`
  return `${input.firstName} ${input.lastName}`
}

/** Nur interne Pfade als Weiterleitungsziel zulassen (kein //host, kein Schema). */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback
  return next
}
