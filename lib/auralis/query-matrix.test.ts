// Tests für Fragen-Matrix und Stabilitäts-Kennzahlen (laufen ohne LLM).
import { test } from "node:test"
import assert from "node:assert/strict"
import { generateQueryMatrix, INTENT_WEIGHTS } from "./query-matrix.ts"
import { computeStability, computeIntentStats } from "./stability.ts"

const cfg = { topics: ["Personal Branding", "LinkedIn"], language: "de" as const }

test("Matrix: Gewichte summieren sich auf 1 (standard + extended, de + en)", () => {
  for (const language of ["de", "en"] as const) {
    for (const depth of ["standard", "extended"] as const) {
      const qs = generateQueryMatrix({ ...cfg, language }, { depth, seed: 1 })
      const sum = qs.reduce((a, q) => a + q.weight, 0)
      assert.ok(Math.abs(sum - 1) < 1e-9, `${language}/${depth}: ${sum}`)
    }
  }
})

test("Matrix: Fragenanzahl je Tiefe", () => {
  assert.equal(generateQueryMatrix(cfg, { depth: "standard", seed: 1 }).length, 7)
  assert.equal(generateQueryMatrix(cfg, { depth: "extended", seed: 1 }).length, 12)
})

test("Matrix: jede Absicht ist vertreten, Intent-Gewicht bleibt fix", () => {
  const qs = generateQueryMatrix(cfg, { depth: "extended", seed: 7 })
  for (const [intent, w] of Object.entries(INTENT_WEIGHTS)) {
    const own = qs.filter(q => q.type === intent)
    assert.ok(own.length > 0, intent)
    const sum = own.reduce((a, q) => a + q.weight, 0)
    assert.ok(Math.abs(sum - w) < 1e-9, `${intent}: ${sum}`)
  }
})

test("Matrix: gleicher Seed = gleiche Fragen, anderer Seed variiert", () => {
  const a = generateQueryMatrix(cfg, { seed: "x" }).map(q => q.prompt)
  const b = generateQueryMatrix(cfg, { seed: "x" }).map(q => q.prompt)
  assert.deepEqual(a, b)
  const variants = new Set(
    Array.from({ length: 20 }, (_, i) =>
      generateQueryMatrix(cfg, { seed: `s${i}` }).map(q => q.prompt).join("|"),
    ),
  )
  assert.ok(variants.size > 1)
})

test("Matrix: Fragen enthalten das Thema, keine doppelten IDs/Prompts", () => {
  const qs = generateQueryMatrix(cfg, { depth: "extended", seed: 3 })
  assert.equal(new Set(qs.map(q => q.id)).size, qs.length)
  assert.equal(new Set(qs.map(q => q.prompt)).size, qs.length)
  for (const q of qs) assert.ok(q.prompt.includes("Personal Branding"), q.prompt)
})

test("Stabilität: eine Runde → null; mehrere → Spannweite & Level", () => {
  assert.equal(computeStability([60]), null)
  const s = computeStability([58, 62, 60])!
  assert.equal(s.rounds, 3)
  assert.equal(s.min, 58)
  assert.equal(s.max, 62)
  assert.equal(s.margin, 2)
  assert.equal(s.level, "hoch")
  assert.equal(computeStability([40, 62])!.level, "niedrig")
})

test("Intent-Stats zählen Erwähnungen je Fragetyp", () => {
  const st = computeIntentStats([
    { type: "a", mentioned: true },
    { type: "a", mentioned: false },
    { type: "b", mentioned: true },
  ])
  assert.deepEqual(st.find(x => x.type === "a"), { type: "a", mentioned: 1, total: 2 })
})

// ─── Zielmärkte ──────────────────────────────────────────────────────────────
import { resolveMarkets, maxMarketsForPlan, MARKETS, locationSystemSuffix } from "./markets.ts"

test("Märkte: Fallback nach Sprache, wenn nichts gewählt", () => {
  assert.deepEqual(resolveMarkets([], "pro", "de").map(m => m.id), ["dach"])
  assert.deepEqual(resolveMarkets(null, "pro", "en").map(m => m.id), ["global"])
})

test("Märkte: ungültige/doppelte IDs fliegen raus, Tarif-Limit greift", () => {
  const sel = ["us", "xx", "us", "uk", "dach", "eu"]
  assert.deepEqual(resolveMarkets(sel, "free", "de").map(m => m.id), ["us"])
  assert.deepEqual(resolveMarkets(sel, "starter", "de").map(m => m.id), ["us", "uk"])
  assert.deepEqual(resolveMarkets(sel, "pro", "de").map(m => m.id), ["us", "uk", "dach"])
  assert.equal(maxMarketsForPlan("enterprise"), 7)
})

test("Märkte: Fragen folgen Sprache und Region des Marktes", () => {
  const us = generateQueryMatrix(
    { topics: ["Personal Branding"], language: MARKETS.us.language, region: MARKETS.us.region },
    { depth: "extended", seed: 5 },
  )
  assert.ok(us.every(q => !/\bim\b|Wer sind/.test(q.prompt)))
  assert.ok(us.some(q => q.prompt.includes("the United States")))
  const glob = generateQueryMatrix(
    { topics: ["Personal Branding"], language: "en", region: "" },
    { depth: "extended", seed: 5 },
  )
  assert.ok(glob.every(q => !q.prompt.includes("undefined")))
})

test("Märkte: Standort-Hinweis nur für Märkte mit Bezug", () => {
  assert.equal(locationSystemSuffix(MARKETS.global), "")
  assert.match(locationSystemSuffix(MARKETS.us), /United States/)
})
