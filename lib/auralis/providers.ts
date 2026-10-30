/**
 * LLM-Provider-Abstraktion (Sprint 14).
 *
 * Vereinheitlicht 4 verschiedene KI-Anbieter hinter einer gemeinsamen `call()`-API:
 *   - Anthropic Claude Sonnet (via @anthropic-ai/sdk)
 *   - OpenAI GPT-4o (via fetch, OpenAI HTTP-API)
 *   - Perplexity Sonar (via fetch, OpenAI-kompatibel)
 *   - Google Gemini 2.5 Flash (via fetch, Generative Language API)
 *
 * Wir verwenden bewusst die "Consumer-Default"-Modelle pro Anbieter, weil wir
 * messen wollen, was ein durchschnittlicher Endnutzer in den Antworten zu sehen
 * bekommt — nicht die Premium-Modelle.
 *
 * Jeder Provider ist optional: wenn der zugehörige API-Key fehlt, wird der
 * Provider gegenüber dem Runner als "nicht verfügbar" gemeldet und übersprungen.
 *
 * Kurzzeitige Fehler (429/5xx) werden wiederholt: die fetch-Provider über
 * fetchWithRetry, Claude über die eingebauten Retries des Anthropic-SDK.
 */

import Anthropic from "@anthropic-ai/sdk"
import type { ThinkingConfigParam } from "@anthropic-ai/sdk/resources/messages"
import type { PlanType } from "@/lib/supabase/halo.types"
import { fetchWithRetry } from "./http-retry"


export type ProviderId = "claude-sonnet" | "gpt-4o" | "perplexity-sonar" | "gemini-flash"

/** Tokenverbrauch eines Aufrufs laut Anbieter. */
export type TokenUsage = { input: number; output: number }

/** Optionale Messkontext-Angaben für einen Aufruf. */
export type CallOptions = {
  /** ISO-3166-Alpha-2: Standort für Anbieter mit Websuche (aktuell Perplexity). */
  country?: string
  /** Erhält den Tokenverbrauch, wenn der Anbieter ihn meldet (für die Kostenrechnung). */
  onUsage?: (usage: TokenUsage) => void
}

function reportUsage(options: CallOptions | undefined, input: number | undefined, output: number | undefined) {
  if (options?.onUsage && typeof input === "number" && typeof output === "number") options.onUsage({ input, output })
}

export type LLMProvider = {
  id: ProviderId
  /** Display-Name in UI + DB-Spalte query_results.model */
  label: string
  /** Genaues Modell-Tag des Anbieters (z.B. "gpt-4o", "sonar", "gemini-2.5-flash"). */
  modelTag: string
  /**
   * Führt einen einzelnen Prompt aus. Wirft bei Netzwerk-/Auth-Fehlern;
   * Caller fängt + loggt, damit ein einzelner Provider-Fehler nicht den
   * gesamten Analyse-Lauf killt.
   */
  call(
    prompt: string,
    systemPrompt: string,
    maxTokens?: number,
    options?: CallOptions,
  ): Promise<string>
  /** Prüft ob der nötige API-Key gesetzt ist. */
  isConfigured(): boolean
}

/**
 * Antwortlänge der Messung, gleich für alle Modelle. Bei 600 endeten alle
 * Claude-Antworten genau am Limit (abgeschnittene Listen, Namen fehlten);
 * GPT-4o kommt im Schnitt mit ~430 aus. Messung 2026-10-30, measurement_answers.output_tokens.
 */
const DEFAULT_MAX_TOKENS = 1000

/**
 * Claude-Modell für Messung UND alle übrigen Claude-Aufrufe (Persona, Chat,
 * Empfehlungen, PDF). Nur hier ändern. claude-sonnet-4-5 ist seit 10/2026
 * für neue Schlüssel nicht mehr verfügbar (404).
 */
export const CLAUDE_MODEL = "claude-sonnet-5-5"

/**
 * Sonnet 5.5 denkt standardmäßig (adaptive), und die Denk-Tokens zählen gegen
 * max_tokens: bei 600 kam meist leerer Text zurück. `disabled` ist bei diesem
 * Modell ein 400, abschalten geht nur mit `between_tools`. SDK 0.96 kennt den
 * Typ noch nicht, daher der Cast. Bei jedem Claude-Aufruf mitgeben.
 */
export const CLAUDE_NO_THINKING = { type: "between_tools" } as unknown as ThinkingConfigParam

// ─── Anthropic Claude Sonnet ────────────────────────────────────────────────

export const claudeProvider: LLMProvider = {
  id: "claude-sonnet",
  label: "Claude Sonnet",
  modelTag: CLAUDE_MODEL,
  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,
  async call(prompt, systemPrompt, maxTokens = DEFAULT_MAX_TOKENS, options) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing")
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      thinking: CLAUDE_NO_THINKING,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    })
    reportUsage(options, message.usage?.input_tokens, message.usage?.output_tokens)
    return message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("\n")
  },
}

// ─── OpenAI GPT-4o ──────────────────────────────────────────────────────────

export const openaiProvider: LLMProvider = {
  id: "gpt-4o",
  label: "GPT-4o",
  modelTag: "gpt-4o",
  isConfigured: () => !!process.env.OPENAI_API_KEY,
  async call(prompt, systemPrompt, maxTokens = DEFAULT_MAX_TOKENS, options) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY missing")
    const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 200)}`)
    }
    const json = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    reportUsage(options, json.usage?.prompt_tokens, json.usage?.completion_tokens)
    return json.choices?.[0]?.message?.content ?? ""
  },
}

// ─── Perplexity Sonar ───────────────────────────────────────────────────────

export const perplexityProvider: LLMProvider = {
  id: "perplexity-sonar",
  label: "Perplexity",
  modelTag: "sonar",
  isConfigured: () => !!process.env.PERPLEXITY_API_KEY,
  async call(prompt, systemPrompt, maxTokens = DEFAULT_MAX_TOKENS, options) {
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) throw new Error("PERPLEXITY_API_KEY missing")

    const send = (withLocation: boolean) =>
      fetchWithRetry("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          ...(withLocation && options?.country
            ? { web_search_options: { user_location: { country: options.country } } }
            : {}),
        }),
      })

    let res = await send(true)
    // Falls der Standort-Parameter abgelehnt wird: einmal ohne wiederholen,
    // damit die Messung nicht an einem Zusatzfeature scheitert.
    if (res.status === 400 && options?.country) res = await send(false)
    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      throw new Error(`Perplexity API ${res.status}: ${errText.slice(0, 200)}`)
    }
    const json = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    reportUsage(options, json.usage?.prompt_tokens, json.usage?.completion_tokens)
    return json.choices?.[0]?.message?.content ?? ""
  },
}

// ─── Google Gemini 2.5 Flash ────────────────────────────────────────────────

export const geminiProvider: LLMProvider = {
  id: "gemini-flash",
  label: "Gemini",
  modelTag: "gemini-2.5-flash",
  isConfigured: () => !!process.env.GOOGLE_AI_API_KEY,
  async call(prompt, systemPrompt, maxTokens = DEFAULT_MAX_TOKENS, options) {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY missing")
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          { role: "user", parts: [{ text: prompt }] },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          // 2.5 Flash „denkt" standardmäßig, und die Denk-Tokens zählen gegen
          // maxOutputTokens: bei 600 blieben nur ~110 Zeichen Antwort übrig,
          // in denen nie ein Name vorkam. Ohne Denken bekommt die Antwort das
          // ganze Budget.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`)
    }
    const json = await res.json() as {
      candidates?: {
        content?: { parts?: { text?: string }[] }
      }[]
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number }
    }
    // Denk-Tokens werden wie Ausgabe abgerechnet (hier abgeschaltet, aber mitgezählt, falls doch).
    const u = json.usageMetadata
    const output = u?.candidatesTokenCount === undefined ? undefined : u.candidatesTokenCount + (u.thoughtsTokenCount ?? 0)
    reportUsage(options, u?.promptTokenCount, output)
    return json.candidates?.[0]?.content?.parts?.map(p => p.text ?? "").join("\n") ?? ""
  },
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const ALL_PROVIDERS: LLMProvider[] = [
  claudeProvider,
  openaiProvider,
  perplexityProvider,
  geminiProvider,
]

// ─── Plan-Gating ────────────────────────────────────────────────────────────

/**
 * Plan-Staffelung (Sprint 14):
 *   - free       → nur Claude
 *   - starter+   → alle 4 (sofern API-Keys konfiguriert)
 *
 * Wenn ein Anbieter keinen API-Key hat, fällt er stillschweigend raus —
 * so können wir Provider schrittweise aktivieren, ohne Code-Änderungen.
 */
export function providersForPlan(plan: PlanType): LLMProvider[] {
  if (plan === "free") {
    return [claudeProvider].filter(p => p.isConfigured())
  }
  // starter / pro / enterprise: alles was konfiguriert ist
  return ALL_PROVIDERS.filter(p => p.isConfigured())
}
