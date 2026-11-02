/**
 * Tarife und ihre Grenzen (Webseite #preise).
 *
 *   free        Check   1 Thema, kein Team, monatlich messen, „Neu messen“ alle 30 Tage
 *   starter     Solo    3 Themen, wöchentlich
 *   pro         Pro     5 Themen, wöchentlich
 *   enterprise  Team/Agentur, auch Bestandskonten: 5 Themen je Person, Teams
 *
 * Den Tarif ändert nur Halo (Admin), siehe Migration 20261031140000_plan_check.sql.
 * Reine Funktionen, keine Datenbank.
 */

import type { FrequencyType, PlanType } from "../supabase/halo.types"

export type PlanLimits = {
  label: string
  topicsPerPerson: number
  teamAllowed: boolean
  /** Messrhythmus neuer Themen; Themen dürfen nicht häufiger gemessen werden. */
  frequency: FrequencyType
  /** Mindestabstand zwischen manuellen Messungen einer Person in Tagen (null = frei). */
  manualIntervalDays: number | null
  /** Abstand der Google-Messung in Tagen. */
  googleIntervalDays: number
  /** Wochenbrief nur im ersten Wochenbrief des Monats. */
  monthlyBrief: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    label: "Check",
    topicsPerPerson: 1,
    teamAllowed: false,
    frequency: "monthly",
    manualIntervalDays: 30,
    googleIntervalDays: 30,
    monthlyBrief: true,
  },
  starter: {
    label: "Solo",
    topicsPerPerson: 3,
    teamAllowed: false,
    frequency: "weekly",
    manualIntervalDays: null,
    googleIntervalDays: 7,
    monthlyBrief: false,
  },
  pro: {
    label: "Pro",
    topicsPerPerson: 5,
    teamAllowed: false,
    frequency: "weekly",
    manualIntervalDays: null,
    googleIntervalDays: 7,
    monthlyBrief: false,
  },
  enterprise: {
    label: "Team/Agentur",
    topicsPerPerson: 5,
    teamAllowed: true,
    frequency: "weekly",
    manualIntervalDays: null,
    googleIntervalDays: 7,
    monthlyBrief: false,
  },
}

export const PLANS: PlanType[] = ["free", "starter", "pro", "enterprise"]

export function planLimits(plan: PlanType | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan ?? "free"] ?? PLAN_LIMITS.free
}

const RANK: Record<FrequencyType, number> = { daily: 0, weekly: 1, monthly: 2 }

/** Häufigster erlaubter Rhythmus: gewünschter Rhythmus, höchstens so oft wie der Tarif erlaubt. */
export function allowedFrequency(plan: PlanType, wanted: FrequencyType): FrequencyType {
  const min = planLimits(plan).frequency
  return RANK[wanted] < RANK[min] ? min : wanted
}

/** Wann die nächste manuelle Messung erlaubt ist; null = jetzt. */
export function nextManualAllowedAt(plan: PlanType, lastManualAt: string | null, now = new Date()): Date | null {
  const days = planLimits(plan).manualIntervalDays
  if (days === null || !lastManualAt) return null
  const next = new Date(Date.parse(lastManualAt) + days * 24 * 60 * 60 * 1000)
  return next > now ? next : null
}

/** Erster Montag des Monats (Tag 1–7) – dann bekommen Check-Konten ihren Brief. */
export function isMonthlyBriefDay(now: Date): boolean {
  const day = Number(new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "Europe/Berlin" }).format(now))
  return day <= 7
}
