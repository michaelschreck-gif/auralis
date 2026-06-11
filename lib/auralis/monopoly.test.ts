// lib/auralis/monopoly.test.ts
// Tests für den Expert Monopoly Score (reine, deterministische Logik).

import { test } from "node:test"
import assert from "node:assert/strict"
import {
  computeMonopoly,
  dominanceOfPosition,
  monopolyBand,
  countRivals,
} from "./monopoly.ts"
import type { VisibilityReport, QueryResult } from "./analyzer.ts"

function qr(
  queryType: string,
  mentioned: boolean,
  position: number | null,
  rawResponse = "",
  weight = 1,
): QueryResult {
  return {
    queryId: queryType,
    queryType,
    prompt: "",
    rawResponse,
    weight,
    signal: {
      mentioned,
      position,
      contextSnippet: null,
      associatedTopics: [],
      sentiment: mentioned ? "positive" : "not_mentioned",
      citedSources: [],
    },
  }
}

function report(results: QueryResult[], personName = "Elon Musk"): VisibilityReport {
  return {
    personName,
    topics: ["Elektroautos"],
    queriedAt: new Date().toISOString(),
    overallScore: 0,
    mentionRate: 0,
    averagePosition: null,
    dominantTopics: [],
    narratives: [],
    queryResults: results,
    scoreBreakdown: { presenceScore: 0, positionScore: 0, contextScore: 0, topicAlignmentScore: 0 },
  }
}

// ─── dominanceOfPosition ──────────────────────────────────────────────────────

test("dominanceOfPosition: Platz 1 = 100, nicht genannt = 0, ungerankt = 35", () => {
  assert.equal(dominanceOfPosition(false, null), 0)
  assert.equal(dominanceOfPosition(true, 1), 100)
  assert.equal(dominanceOfPosition(true, 2), 82)
  assert.equal(dominanceOfPosition(true, 3), 68)
  assert.equal(dominanceOfPosition(true, null), 35)
  assert.equal(dominanceOfPosition(true, 12), 22)
})

// ─── Bänder ──────────────────────────────────────────────────────────────────

test("monopolyBand: Schwellen korrekt", () => {
  assert.equal(monopolyBand(95).label, "Monopol")
  assert.equal(monopolyBand(80).label, "Monopol")
  assert.equal(monopolyBand(60).label, "Dominant")
  assert.equal(monopolyBand(40).label, "Umkämpft")
  assert.equal(monopolyBand(20).label, "Randständig")
  assert.equal(monopolyBand(0).label, "Unsichtbar")
})

// ─── Volles Monopol ───────────────────────────────────────────────────────────

test("Durchgehend Platz 1 über offene Fragen → Monopol (100)", () => {
  const r = report([
    qr("expert_discovery", true, 1),
    qr("leadership", true, 1),
    qr("popular_figures", true, 1),
  ])
  const m = computeMonopoly(r)
  assert.equal(m.score, 100)
  assert.equal(m.band.label, "Monopol")
  assert.equal(m.topPositionShare, 100)
  assert.equal(m.mentionShare, 100)
  assert.equal(m.bestPosition, 1)
})

// ─── Nie genannt → Unsichtbar ─────────────────────────────────────────────────

test("Nie genannt → Score 0, Unsichtbar, bestPosition null", () => {
  const r = report([
    qr("expert_discovery", false, null),
    qr("leadership", false, null),
  ])
  const m = computeMonopoly(r)
  assert.equal(m.score, 0)
  assert.equal(m.band.label, "Unsichtbar")
  assert.equal(m.bestPosition, null)
  assert.equal(m.topPositionShare, 0)
})

// ─── comparison-Archetyp zählt nicht zum Monopol ─────────────────────────────

test("comparison wird ignoriert, solange offene Fragen existieren", () => {
  const r = report([
    qr("expert_discovery", true, 1),
    qr("comparison", false, null), // darf den Score nicht drücken
  ])
  const m = computeMonopoly(r)
  assert.equal(m.openQueryCount, 1)
  assert.equal(m.score, 100)
})

// ─── Rivalen-Extraktion ───────────────────────────────────────────────────────

test("countRivals findet andere Namen, ohne die Zielperson", () => {
  const r = report([
    qr(
      "expert_discovery",
      true,
      2,
      "Zu den führenden Köpfen zählen Elon Musk, Mary Barra und Herbert Diess.",
    ),
  ])
  const n = countRivals(r, "Elon Musk")
  // Mary Barra + Herbert Diess = 2 (Elon Musk ausgeschlossen)
  assert.equal(n, 2)
})

test("countRivals filtert Satzanfangs-Füllwörter", () => {
  const r = report([
    qr("leadership", true, 1, "Die Branche wächst. Im Vergleich punktet Elon Musk klar."),
  ])
  // „Die Branche", „Im Vergleich" dürfen NICHT als Namen zählen; Elon Musk ist Ziel.
  assert.equal(countRivals(r, "Elon Musk"), 0)
})
