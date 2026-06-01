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
import { sanitizeTargetName } from "./analyzer"

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

/** Rang → Punktwert: Platz 1 = 100, danach ca. −8 pro Position (Platz 10 ≈ 28). */
function rankToScore(rank: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - (rank - 1) * 8)))
}

/** Ganzwort-Treffer (Unicode-bewusst), beide Argumente lower-case. */
function containsWholeName(haystackLower: string, nameLower: string): boolean {
  if (!nameLower) return false
  const escaped = nameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u").test(haystackLower)
}

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

/** Sprache → DataForSEO language_code + location_name. */
function localeFor(language?: string): { language_code: string; location_name: string } {
  if (language === "de") return { language_code: "de", location_name: "Germany" }
  return { language_code: "en", location_name: "United States" }
}

type DfsItem = {
  type?: string
  rank_absolute?: number
  title?: string
  url?: string
  domain?: string
  description?: string
  text?: string
}

export const serpProvider: SeoProvider = {
  source: "serp",
  label: "Google-Suche (SERP)",
  isConfigured() {
    return !!process.env.DATAFORSEO_LOGIN && !!process.env.DATAFORSEO_PASSWORD
  },
  async run(input) {
    const login = process.env.DATAFORSEO_LOGIN
    const password = process.env.DATAFORSEO_PASSWORD
    if (!login || !password) return { ok: false, reason: "not_configured" }

    const topics = input.topics.filter(Boolean)
    if (topics.length === 0) {
      return { ok: false, reason: "error", message: "Keine Themen zum Abfragen." }
    }

    const name = sanitizeTargetName(input.targetName).toLowerCase()
    const ownHost = hostOf(input.websiteUrl)
    const { language_code, location_name } = localeFor(input.language)
    const auth = "Basic " + Buffer.from(`${login}:${password}`).toString("base64")

    const perTopic: { topic: string; position: number | null; url?: string | null }[] = []
    const positionScores: number[] = []
    let knowledgePanel = false
    let aiOverview = false

    for (const topic of topics) {
      try {
        const res = await fetch(
          "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
          {
            method: "POST",
            headers: { Authorization: auth, "Content-Type": "application/json" },
            body: JSON.stringify([{ keyword: topic, language_code, location_name, depth: 20 }]),
          },
        )
        if (!res.ok) {
          // Ein fehlgeschlagenes Thema soll den Lauf nicht killen.
          perTopic.push({ topic, position: null })
          continue
        }
        const json = await res.json()
        const items: DfsItem[] = json?.tasks?.[0]?.result?.[0]?.items ?? []

        // Position in den organischen Treffern: erster Treffer, dessen Titel/
        // Beschreibung den Namen als ganzes Wort enthält ODER dessen Domain die
        // eigene Website ist.
        let foundRank: number | null = null
        for (const it of items) {
          if (it.type !== "organic") continue
          const hay = `${it.title ?? ""} ${it.description ?? ""}`.toLowerCase()
          const domainMatch = ownHost && hostOf(it.url ?? it.domain) === ownHost
          if (containsWholeName(hay, name) || domainMatch) {
            foundRank = typeof it.rank_absolute === "number" ? it.rank_absolute : null
            perTopic.push({ topic, position: foundRank, url: it.url ?? null })
            break
          }
        }
        if (foundRank === null) perTopic.push({ topic, position: null })
        else positionScores.push(rankToScore(foundRank))

        // Knowledge Panel: knowledge_graph-Item, dessen Titel den Namen enthält.
        if (items.some(it => it.type === "knowledge_graph" && containsWholeName((it.title ?? "").toLowerCase(), name))) {
          knowledgePanel = true
        }
        // AI Overview: ai_overview-Item, dessen Text den Namen enthält.
        if (items.some(it => it.type === "ai_overview" && containsWholeName(`${it.text ?? ""} ${it.title ?? ""}`.toLowerCase(), name))) {
          aiOverview = true
        }
      } catch {
        perTopic.push({ topic, position: null })
      }
    }

    const foundCount = perTopic.filter(t => t.position !== null).length
    const signals: SeoSignals = {
      serpPresence: Math.round((foundCount / topics.length) * 100),
      serpPosition: positionScores.length
        ? Math.round(positionScores.reduce((a, b) => a + b, 0) / positionScores.length)
        : 0,
      knowledgePanel: knowledgePanel ? 100 : 0,
      aiOverview: aiOverview ? 100 : 0,
    }

    return { ok: true, signals, perTopic }
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
