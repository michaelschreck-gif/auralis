// lib/auralis/analyzer.test.ts
// Regressions-Tests für die Namens-Erkennung des Analyzers.
// Laufen ohne LLM (reine, deterministische Logik) via `npm test`.
//
// Hintergrund: Der „Maud Schock"-Bug (2026-05-30) erzeugte falsche 100/100,
// weil der Such-Name ein Themen-Suffix enthielt („Maud Schock — Personal
// Branding") und das generische letzte Wort („Branding") in jeder Antwort als
// Treffer zündete. Diese Tests fixieren das korrekte Verhalten dauerhaft.

import { test } from "node:test"
import assert from "node:assert/strict"
import {
  extractMentionSignal,
  sanitizeTargetName,
  buildVisibilityReport,
} from "./analyzer.ts"

// ─── Echte Fixtures aus der DB (gekürzt) ──────────────────────────────────────

/** Antwort auf eine Personal-Branding-Frage, die Maud NICHT nennt (echter Fall). */
const BEN_SCHULZ_ANSWER = `# Führende Personal Branding Experten im deutschsprachigen Raum

Hier sind die wichtigsten Experten mit ihren jeweiligen Stärken:

## 1. **Ben Schulz**
Einer der bekanntesten Personal Branding Experten in Deutschland. Stärken: Sehr starke LinkedIn-Präsenz, Branding-Strategien für Führungskräfte.

## 2. **Felix Plötz**
Bekannt für seine Bücher und Vorträge zu Personal Branding und Entrepreneurship.`

/** Antwort, die Maud Schock tatsächlich auf Platz 2 nennt (konstruiert). */
const MENTIONS_MAUD = `# Personal Branding Experten

## 1. **Ben Schulz**
Etablierter Experte.

## 2. **Maud Schock**
Maud Schock ist eine anerkannte Stimme für Personal Branding mit starker digitaler Präsenz.`

/** E-Auto-Antwort, die das Themenwort enthält, aber keinen Personennamen (Elon-Fall). */
const EAUTO_ANSWER = `Elektrische Fahrzeuge gewinnen rasant an Bedeutung. Führende Hersteller
elektrischer Autos investieren stark in Reichweite und Ladeinfrastruktur.`

// ─── sanitizeTargetName ───────────────────────────────────────────────────────

test("sanitizeTargetName entfernt Themen-Suffixe und Emojis", () => {
  assert.equal(sanitizeTargetName("Maud Schock — Personal Branding"), "Maud Schock")
  assert.equal(sanitizeTargetName("🇩🇪 Elon Musk — Elektrische Autos"), "Elon Musk")
  assert.equal(sanitizeTargetName("Anna - Marketing"), "Anna")
  assert.equal(sanitizeTargetName("Celine Flores Willers"), "Celine Flores Willers")
  assert.equal(sanitizeTargetName("Dr. Jan-Ole Meyer"), "Dr. Jan-Ole Meyer")
})

// ─── Der eigentliche Bug: darf NIE wieder als Treffer zünden ──────────────────

test("BUG-REGRESSION: Themen-Suffix-Name zündet NICHT auf generischem Wort", () => {
  // genau der Maud-Fall: Name mit Themen-Suffix, Antwort nennt Maud nicht
  const r = extractMentionSignal(BEN_SCHULZ_ANSWER, "Maud Schock — Personal Branding", "q1", 0.2, "p", "expert_discovery")
  assert.equal(r.signal.mentioned, false, "Maud darf nicht als erwähnt gelten")
})

test("BUG-REGRESSION: Profilname zündet nicht auf reiner Themen-Antwort", () => {
  // Nach dem Fix wird der PROFILNAME gesucht (z.B. „Elon Musk"), nicht der
  // Themen-Eintrag. In einer reinen E-Auto-Antwort ohne Personennamen darf
  // daher kein Treffer entstehen.
  const r = extractMentionSignal(EAUTO_ANSWER, "Elon Musk", "q1", 0.2, "p", "expert_discovery")
  assert.equal(r.signal.mentioned, false)
})

test("Profilname ohne Vorkommen → nicht erwähnt", () => {
  const r = extractMentionSignal(BEN_SCHULZ_ANSWER, "Maud Schock", "q1", 0.2, "p", "expert_discovery")
  assert.equal(r.signal.mentioned, false)
  assert.equal(r.signal.sentiment, "not_mentioned")
})

// ─── Echte Treffer müssen weiterhin funktionieren ─────────────────────────────

test("Echte Namensnennung → erwähnt, mit plausibler Position", () => {
  const r = extractMentionSignal(MENTIONS_MAUD, "Maud Schock", "q1", 0.2, "p", "expert_discovery")
  assert.equal(r.signal.mentioned, true)
  // Position ist eine Listen-Heuristik; wichtig ist: gesetzt und vorne (≤ 3).
  assert.ok(r.signal.position !== null && r.signal.position >= 1 && r.signal.position <= 3)
  assert.equal(r.signal.sentiment, "positive")
})

test("Wettbewerber mit distinktem Nachnamen funktioniert (Celine)", () => {
  const yes = extractMentionSignal(
    "Empfehlenswert ist celine flores willers für Personal Branding.",
    "celine flores willers", "q1", 0.2, "p", "recommendation",
  )
  assert.equal(yes.signal.mentioned, true)

  const no = extractMentionSignal(BEN_SCHULZ_ANSWER, "celine flores willers", "q1", 0.2, "p", "recommendation")
  assert.equal(no.signal.mentioned, false)
})

test("Nachname matcht nur als ganzes Wort (kein Teilstring)", () => {
  // "Meyer" darf nicht in "Meyerhof" zünden
  const r = extractMentionSignal("Das Unternehmen Meyerhof GmbH ist führend.", "Anna Meyer", "q1", 0.2, "p", "expert_discovery")
  assert.equal(r.signal.mentioned, false)
})

test("Themen-Suffix mit Bindestrich wird abgeschnitten (kein Fehl-Treffer)", () => {
  // „Coach Müller — Personal Branding": nach sanitize bleibt „Coach Müller";
  // eine Ben-Schulz-Antwort (kein Müller) darf nicht zünden.
  const r = extractMentionSignal(BEN_SCHULZ_ANSWER, "Coach Müller — Personal Branding", "q1", 0.2, "p", "expert_discovery")
  assert.equal(r.signal.mentioned, false)
})

test("Leerer/whitespace Name crasht nicht und gilt als nicht erwähnt", () => {
  const r = extractMentionSignal(BEN_SCHULZ_ANSWER, "   ", "q1", 0.2, "p", "expert_discovery")
  assert.equal(r.signal.mentioned, false)
})

// ─── Aggregation: Smoke-Test der Score-Bildung ────────────────────────────────

test("buildVisibilityReport: keine Treffer → Score 0, mentionRate 0", () => {
  const qr = [
    extractMentionSignal(BEN_SCHULZ_ANSWER, "Maud Schock", "q1", 0.5, "p", "expert_discovery"),
    extractMentionSignal(BEN_SCHULZ_ANSWER, "Maud Schock", "q2", 0.5, "p", "recommendation"),
  ]
  const report = buildVisibilityReport("Maud Schock", ["Personal Branding"], qr)
  assert.equal(report.mentionRate, 0)
  assert.equal(report.overallScore, 0)
  assert.equal(report.scoreBreakdown.presenceScore, 0)
})

test("buildVisibilityReport: voller Treffer auf Platz 1 → hoher, aber plausibler Score", () => {
  const qr = [
    extractMentionSignal(MENTIONS_MAUD, "Maud Schock", "q1", 1.0, "p", "expert_discovery"),
  ]
  const report = buildVisibilityReport("Maud Schock", ["Personal Branding"], qr)
  assert.equal(report.mentionRate, 100)
  assert.ok(report.overallScore > 0 && report.overallScore <= 100)
})
