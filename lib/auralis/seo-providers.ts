/**
 * SEO-Provider-Abstraktion — Gegenstück zu providers.ts (LLM-Provider).
 *
 * Zwei Quellen, beide OPTIONAL (laufen nur, wenn der zugehörige Key/Token
 * gesetzt ist; sonst meldet der Provider sich als „nicht konfiguriert"):
 *
 *   serp  — Google-Suche via DataForSEO (Namenssuche + „Name Thema“).
 *           Braucht DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD.
 *   gsc   — Google Search Console (eigene Domain). Noch nicht angebunden.
 *
 * Nicht konfigurierte Quellen liefern `{ ok: false, reason: "not_configured" }`,
 * sodass UI und Messung ehrliche „noch nicht aktiv“-Zustände zeigen.
 */

import type { SeoSignals } from "./seo-score"
import { sanitizeTargetName } from "./analyzer"
import {
  TOP_RESULTS,
  evaluateNameSearch,
  evaluateTopicSearch,
  googleSignals,
  hostOf,
  type NameSearchResult,
  type SerpItem,
} from "./seo-serp"

export type SeoSource = "serp" | "gsc"

/** Ergebnis der Suche „Name Thema“ je Thema. */
export type SeoTopicResult = { topic: string; position: number | null; url?: string | null; error?: string }

export type SeoProviderResult =
  | { ok: true; signals: SeoSignals; perTopic?: SeoTopicResult[]; nameSearch?: NameSearchResult }
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

// ─── off-site: Google SERP (DataForSEO) ───────────────────────────────────────

/** Sprache → DataForSEO language_code + location_name. */
function localeFor(language?: string): { language_code: string; location_name: string } {
  if (language === "de") return { language_code: "de", location_name: "Germany" }
  return { language_code: "en", location_name: "United States" }
}

type SerpCall = { ok: true; items: SerpItem[] } | { ok: false; error: string }

/** Eine Google-Suche (erste Ergebnisseite). DataForSEO meldet Fehler auch bei HTTP 200 im Body. */
async function searchGoogle(keyword: string, auth: string, locale: { language_code: string; location_name: string }): Promise<SerpCall> {
  try {
    const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      // depth zählt auch Knowledge Panel, „Ähnliche Fragen“ usw. mit – doppelt anfragen,
      // damit sicher 10 normale Treffer dabei sind.
      body: JSON.stringify([{ keyword, ...locale, depth: TOP_RESULTS * 2 }]),
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const json = await res.json()
    const task = json?.tasks?.[0]
    if (json?.status_code !== 20000 || task?.status_code !== 20000) {
      return { ok: false, error: task?.status_message ?? json?.status_message ?? "unbekannter Fehler" }
    }
    return { ok: true, items: task?.result?.[0]?.items ?? [] }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Was findet, wer die Person googelt? (Methode: seo-serp.ts)
 *   1 Suche „Vorname Nachname“ + je Thema 1 Suche „Name Thema“.
 * Ohne Namenssuche gibt es kein Ergebnis (statt eines stillen Scores 0);
 * Themen, deren Suche scheitert, zählen nicht mit.
 */
export const serpProvider: SeoProvider = {
  source: "serp",
  label: "Google-Suche (DataForSEO)",
  isConfigured() {
    return !!process.env.DATAFORSEO_LOGIN && !!process.env.DATAFORSEO_PASSWORD
  },
  async run(input) {
    const login = process.env.DATAFORSEO_LOGIN
    const password = process.env.DATAFORSEO_PASSWORD
    if (!login || !password) return { ok: false, reason: "not_configured" }

    const name = sanitizeTargetName(input.targetName)
    const nameLower = name.toLowerCase()
    const ownHost = hostOf(input.websiteUrl)
    const locale = localeFor(input.language)
    const auth = "Basic " + Buffer.from(`${login}:${password}`).toString("base64")
    const topics = input.topics.filter(Boolean)

    const [nameCall, ...topicCalls] = await Promise.all([
      searchGoogle(name, auth, locale),
      ...topics.map(t => searchGoogle(`${name} ${t}`, auth, locale)),
    ])
    if (!nameCall.ok) return { ok: false, reason: "error", message: `DataForSEO: ${nameCall.error}` }

    const nameSearch = evaluateNameSearch(nameCall.items, nameLower, ownHost)
    const perTopic: SeoTopicResult[] = []
    const answered: ReturnType<typeof evaluateTopicSearch>[] = []
    topics.forEach((topic, i) => {
      const call = topicCalls[i]
      if (!call.ok) {
        perTopic.push({ topic, position: null, error: call.error })
        return
      }
      const r = evaluateTopicSearch(call.items, nameLower, ownHost)
      answered.push(r)
      perTopic.push({ topic, position: r.position, url: r.url })
    })

    return { ok: true, signals: googleSignals(nameSearch, answered), perTopic, nameSearch }
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
  perTopic: SeoTopicResult[]
  /** Namenssuche (was findet, wer die Person googelt). */
  nameSearch?: NameSearchResult
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
  let nameSearch: NameSearchResult | undefined

  for (const { provider, result } of results) {
    if (result.ok) {
      Object.assign(signals, result.signals)
      sourcesUsed.push(provider.source)
      if (result.perTopic) perTopic.push(...result.perTopic)
      if (result.nameSearch) nameSearch = result.nameSearch
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

  return { signals, sourcesUsed, perSource, perTopic, nameSearch }
}

async function safeRun(p: SeoProvider, input: SeoRunInput): Promise<SeoProviderResult> {
  try {
    return await p.run(input)
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "unknown error" }
  }
}
