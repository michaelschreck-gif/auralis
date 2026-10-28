// lib/auralis/impulses.test.ts
// Tests für die Impulse-Erkennung (Personen aus KI-Antworten).

import { test } from "node:test"
import assert from "node:assert/strict"
import { extractPersons, buildImpulses, looksLikePersonName } from "./impulses.ts"

const GEMINI_STYLE = `Hier sind einige führende Stimmen:

*   **Ben Schulz:** Bekannt für seine Bücher und Keynotes zu Personal Branding.
*   **Prof. Dr. Anna-Lena Müller** (Universität Mannheim): Forscht zu Datenkompetenz und hostet einen Podcast.
*   **LinkedIn:** Die wichtigste Plattform für B2B.

**Fazit:** Folge diesen Personen auf LinkedIn.`

const HEADING_STYLE = `# Führende Personal Branding Experten

## 1. **Ben Schulz**
Einer der bekanntesten Experten in Deutschland. Sehr starke LinkedIn-Präsenz.

## 2. **Felix Plötz**
Bekannt für seine Bücher und Vorträge.

## 3. **Maud Schock**
Anerkannte Stimme für Personal Branding.`

const PLAIN_LIST = `1. Sascha Lobo – Autor und Kolumnist zu digitaler Transformation.
2. Data Science Teams – keine Person
3. Miriam Meckel, Gründerin und Professorin`

test("erkennt fett gedruckte Namen in Gemini-Listen samt Kontext", () => {
  const people = extractPersons(GEMINI_STYLE)
  assert.deepEqual(people.map(p => p.name), ["Ben Schulz", "Anna-Lena Müller"])
  assert.match(people[0].context, /Bücher und Keynotes/)
  assert.match(people[1].context, /Podcast/)
})

test("erkennt Namen in Überschriften und nimmt die Beschreibung aus der nächsten Zeile", () => {
  const people = extractPersons(HEADING_STYLE)
  assert.deepEqual(people.map(p => p.name), ["Ben Schulz", "Felix Plötz", "Maud Schock"])
  assert.match(people[1].context, /Bücher und Vorträge/)
})

test("erkennt einfache nummerierte Listen und ignoriert Nicht-Namen", () => {
  const people = extractPersons(PLAIN_LIST)
  assert.deepEqual(people.map(p => p.name), ["Sascha Lobo", "Miriam Meckel"])
})

test("Überschriften und Plattformen sind keine Personen", () => {
  assert.equal(looksLikePersonName("Personal Branding"), false)
  assert.equal(looksLikePersonName("Führende Experten"), false)
  assert.equal(looksLikePersonName("LinkedIn"), false)
  assert.equal(looksLikePersonName("Ursula von der Leyen"), true)
})

test("buildImpulses schließt die eigene Person aus und zählt Nennungen", () => {
  const summary = buildImpulses(
    [
      { prompt: "q1", response: HEADING_STYLE, topic: "Personal Branding" },
      { prompt: "q2", response: GEMINI_STYLE, topic: "Personal Branding" },
      { prompt: "q3", response: null },
    ],
    "Maud Schock — Personal Branding",
  )
  assert.equal(summary.answersAnalyzed, 2)
  const names = summary.people.map(p => p.name)
  assert.ok(!names.includes("Maud Schock"), "eigene Person darf nicht auftauchen")
  assert.equal(summary.people[0].name, "Ben Schulz")
  assert.equal(summary.people[0].mentions, 2)
  assert.deepEqual(summary.people[0].topics, ["Personal Branding"])
  const keys = summary.patterns.map(p => p.key)
  assert.ok(keys.includes("books"))
  assert.ok(keys.includes("podcast"))
})
