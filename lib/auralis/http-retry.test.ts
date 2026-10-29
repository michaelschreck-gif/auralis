import { test } from "node:test"
import assert from "node:assert/strict"
import { fetchWithRetry } from "./http-retry.ts"

/** Fake-fetch, das die Statuscodes der Reihe nach liefert. */
function fakeFetch(responses: { status: number; body?: string; headers?: Record<string, string> }[]) {
  let calls = 0
  const impl = (async () => {
    const r = responses[Math.min(calls, responses.length - 1)]
    calls++
    return new Response(r.body ?? "", { status: r.status, headers: r.headers })
  }) as typeof fetch
  return { impl, calls: () => calls }
}

const noSleep = async () => {}

test("Retry: 503 dann 200 → zweiter Versuch gewinnt", async () => {
  const f = fakeFetch([{ status: 503 }, { status: 200, body: "ok" }])
  const res = await fetchWithRetry("x", {}, { fetchImpl: f.impl, sleep: noSleep })
  assert.equal(res.status, 200)
  assert.equal(await res.text(), "ok")
  assert.equal(f.calls(), 2)
})

test("Retry: dauerhaft 503 → nach allen Versuchen die letzte Fehlerantwort", async () => {
  const f = fakeFetch([{ status: 503, body: "busy" }])
  const res = await fetchWithRetry("x", {}, { fetchImpl: f.impl, sleep: noSleep })
  assert.equal(res.status, 503)
  assert.equal(await res.text(), "busy")
  assert.equal(f.calls(), 3)
})

test("Retry: 400 und 401 werden nicht wiederholt", async () => {
  for (const status of [400, 401]) {
    const f = fakeFetch([{ status }])
    const res = await fetchWithRetry("x", {}, { fetchImpl: f.impl, sleep: noSleep })
    assert.equal(res.status, status)
    assert.equal(f.calls(), 1)
  }
})

test("Retry: 429 wegen fehlendem Guthaben wird nicht wiederholt, Body bleibt lesbar", async () => {
  const body = '{"error":{"type":"insufficient_quota"}}'
  const f = fakeFetch([{ status: 429, body }])
  const res = await fetchWithRetry("x", {}, { fetchImpl: f.impl, sleep: noSleep })
  assert.equal(res.status, 429)
  assert.equal(await res.text(), body)
  assert.equal(f.calls(), 1)
})

test("Retry: Retry-After wird beachtet und gedeckelt", async () => {
  const waits: number[] = []
  const f = fakeFetch([
    { status: 429, headers: { "retry-after": "2" } },
    { status: 429, headers: { "retry-after": "60" } },
    { status: 200 },
  ])
  await fetchWithRetry("x", {}, { fetchImpl: f.impl, sleep: async ms => { waits.push(ms) } })
  assert.deepEqual(waits, [2000, 5000])
})
