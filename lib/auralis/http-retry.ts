/**
 * Neuversuch für kurzzeitige Anbieter-Fehler (429 Rate-Limit, 5xx Überlastung).
 *
 * Ein einzelner fehlgeschlagener Aufruf macht im Runner die ganze Messrunde
 * eines Providers ungültig — eine kurze Überlastung (z.B. Gemini 503 „high
 * demand") kostet sonst das komplette Modell. Darum hier wenige, kurze
 * Wiederholungen. Die Wartezeiten bleiben klein, weil manuelle Analysen nur
 * 60 s Laufzeit haben.
 *
 * Nicht wiederholt wird ein 429 wegen fehlenden Guthabens (OpenAI
 * „insufficient_quota"): das heilt sich nicht von selbst.
 */

export const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])

/** Wartezeiten vor dem 2. und 3. Versuch. */
export const RETRY_DELAYS_MS = [1_000, 3_000]

/** Obergrenze für einen Retry-After-Header des Anbieters. */
const MAX_RETRY_AFTER_MS = 5_000

export type RetryDeps = {
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  delays?: number[]
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/** Wartezeit aus Retry-After (Sekunden), gedeckelt; sonst der Standardwert. */
function retryDelay(res: Response, fallback: number): number {
  const header = res.headers.get("retry-after")
  const seconds = header ? Number(header) : NaN
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS)
  return fallback
}

/**
 * Wie fetch, wiederholt aber bei 429/5xx bis zu RETRY_DELAYS_MS.length Mal.
 * Liefert die letzte Antwort (auch eine Fehlerantwort) — der Aufrufer prüft
 * res.ok wie gewohnt.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  deps: RetryDeps = {},
): Promise<Response> {
  const fetchImpl = deps.fetchImpl ?? fetch
  const sleep = deps.sleep ?? defaultSleep
  const delays = deps.delays ?? RETRY_DELAYS_MS

  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(url, init)
    if (!RETRYABLE_STATUS.has(res.status) || attempt >= delays.length) return res

    // Body einmal lesen, um Guthaben-Fehler zu erkennen; danach eine
    // gleichwertige Antwort zurückgeben, damit der Aufrufer ihn noch lesen kann.
    const body = await res.text().catch(() => "")
    if (res.status === 429 && body.includes("insufficient_quota")) {
      return new Response(body, { status: res.status, headers: res.headers })
    }
    await sleep(retryDelay(res, delays[attempt]))
  }
}
