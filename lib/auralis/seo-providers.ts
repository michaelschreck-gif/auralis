/**
 * SEO-Provider-Abstraktion — Gegenstück zu providers.ts (LLM-Provider).
 *
 * Zwei Quellen, beide OPTIONAL (laufen nur, wenn der zugehörige Key/Token
 * gesetzt ist; sonst meldet der Provider sich als „nicht konfiguriert"):
 *
 *   serp  — Google-SERP via SERP-API (SerpApi ODER DataForSEO).
 *           Braucht SERPAPI_KEY oder DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD.
 *   gsc   — Google Search Console (eigene Domain).
 *           Braucht GOOGLE_OAUTH-Setup + verbundene Domain pro User.
 *
 * STAND: Gerüst. Die `run()`-Methoden sind als Stubs implementiert — die echte
 * API-Anbindung folgt, sobald die Keys gesetzt sind. Bis dahin liefern sie
 * sauber `{ ok: false, reason: "not_configured" }`, sodass UI + Runner nie
 * crashen, sondern ehrliche „noch nicht aktiv"-Zustände zeigen.
 */

import type { SeoSignals } from "./seo-score"

export type SeoSource = "serp" | "gsc"

export type SeoProviderResult =
  | { ok: true; signals: SeoSignals; perTopic?: { topic: string; position: number | null; url?: string | null }[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string }

export type SeoRunInput = {
  /** Zu suchender Name (Profilname). */
  targetName: string
  /** Themen aus monitoring_schedules.query. */
  topics: string[]
  /** Eigene Domain (für GSC), falls vorhanden. */
  websiteUrl?: string | null
  /** Sprache für regionale Suche. */
  language?: string
}

export type SeoProvider = {
  source: SeoSource
  label: string
  isConfigured(): boolean
  run(input: SeoRunInput): Promise<SeoProviderResult>
}

// ─── off-site: Google SERP ────────────────────────────────────────────────────

export const serpProvider: SeoProvider = {
  source: "serp",
  label: "Google-Suche (SERP)",
  isConfigured() {
    return (
      !!process.env.SERPAPI_KEY ||
      (!!process.env.DATAFORSEO_LOGIN && !!process.env.DATAFORSEO_PASSWORD)
    )
  },
  async run() {
    // TODO(seo): echte SERP-API-Anbindung (SerpApi /search.json oder DataForSEO
    // SERP-Endpoint) — pro Thema "name + topic" abfragen, Position der Person
    // in organic_results bestimmen, knowledge_graph + ai_overview-Präsenz lesen,
    // in SeoSignals umrechnen.
    if (!this.isConfigured()) return { ok: false, reason: "not_configured" }
    return {
      ok: false,
      reason: "error",
      message: "SERP-Provider konfiguriert, aber Anbindung noch nicht implementiert.",
    }
  },
}

// ─── on-site: Google Search Console ───────────────────────────────────────────

export const gscProvider: SeoProvider = {
  source: "gsc",
  label: "Google Search Console",
  isConfigured() {
    return !!process.env.GOOGLE_OAUTH_CLIENT_ID && !!process.env.GOOGLE_OAUTH_CLIENT_SECRET
  },
  async run(input) {
    // TODO(seo): Search-Console Search-Analytics-API (searchanalytics.query) für
    // die verbundene Property abfragen → Ø-Position + CTR/Klicks in SeoSignals.
    if (!this.isConfigured()) return { ok: false, reason: "not_configured" }
    if (!input.websiteUrl) {
      return { ok: false, reason: "not_configured", message: "Keine eigene Domain hinterlegt." }
    }
    return {
      ok: false,
      reason: "error",
      message: "GSC-Provider konfiguriert, aber Anbindung noch nicht implementiert.",
    }
  },
}

export const SEO_PROVIDERS: SeoProvider[] = [serpProvider, gscProvider]

export type SeoRunOutcome = {
  /** Aggregierte Signale aller erfolgreichen Quellen. */
  signals: SeoSignals
  /** Welche Quellen erfolgreich liefen. */
  sourcesUsed: SeoSource[]
  /** Pro Quelle der Status (für Diagnose/UI). */
  perSource: { source: SeoSource; ok: boolean; reason?: string; message?: string }[]
  perTopic: { topic: string; position: number | null; url?: string | null }[]
}

/**
 * Orchestriert alle konfigurierten SEO-Quellen für ein Schedule und merged die
 * Signale. Crasht nie: nicht konfigurierte oder fehlschlagende Quellen werden in
 * `perSource` vermerkt, beeinflussen aber die anderen nicht.
 *
 * Solange keine Quelle echte Daten liefert (Gerüst-Stand), ist `signals` leer
 * und `sourcesUsed` = [] — der Aufrufer schreibt dann KEINEN seo_report bzw.
 * zeigt einen „noch nicht aktiv"-Zustand.
 */
export async function runSeoAnalysis(input: SeoRunInput): Promise<SeoRunOutcome> {
  const results = await Promise.all(
    SEO_PROVIDERS.map(async p => ({ provider: p, result: await safeRun(p, input) })),
  )

  const signals: SeoSignals = {}
  const sourcesUsed: SeoSource[] = []
  const perSource: SeoRunOutcome["perSource"] = []
  const perTopic: SeoRunOutcome["perTopic"] = []

  for (const { provider, result } of results) {
    if (result.ok) {
      Object.assign(signals, result.signals)
      sourcesUsed.push(provider.source)
      if (result.perTopic) perTopic.push(...result.perTopic)
      perSource.push({ source: provider.source, ok: true })
    } else {
      perSource.push({
        source: provider.source,
        ok: false,
        reason: result.reason,
        message: result.message,
      })
    }
  }

  return { signals, sourcesUsed, perSource, perTopic }
}

async function safeRun(p: SeoProvider, input: SeoRunInput): Promise<SeoProviderResult> {
  try {
    return await p.run(input)
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "unknown error" }
  }
}
