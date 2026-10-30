// lib/halo/impulses.test.ts
// Tests für die Impulse (Personen aus KI-Antworten, Score je Thema).

import { test } from "node:test"
import assert from "node:assert/strict"
import { extractPersons, buildImpulses, cleanContext, impulseScore, looksLikePersonName } from "./impulses.ts"

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

test("Score: Nennungsanteil 60 %, Platz 40 %", () => {
  assert.equal(impulseScore(2, 2, 1), 100)
  assert.equal(impulseScore(1, 4, 1), 55) // 25*0.6 + 100*0.4
  assert.equal(impulseScore(2, 4, 3), 58) // 50*0.6 + 70*0.4
  assert.equal(impulseScore(0, 4, 1), 0)
})

test("buildImpulses: ohne eigene Person, Score je Thema, Einzelnennungen gefiltert", () => {
  const summary = buildImpulses(
    [
      { prompt: "q1", response: HEADING_STYLE, topic: "Personal Branding" },
      { prompt: "q2", response: GEMINI_STYLE, topic: "Personal Branding" },
      { prompt: "q3", response: PLAIN_LIST, topic: "Digitalisierung" },
      { prompt: "q4", response: null },
    ],
    "Maud Schock",
  )
  assert.equal(summary.answersAnalyzed, 3)
  const names = summary.people.map(p => p.name)
  assert.ok(!names.includes("Maud Schock"), "eigene Person darf nicht auftauchen")
  // Felix Plötz, Anna-Lena Müller, Sascha Lobo nur einmal genannt → gefiltert
  assert.deepEqual(names, ["Ben Schulz"])
  const ben = summary.people[0]
  assert.equal(ben.mentions, 2)
  assert.equal(ben.score, 100)
  assert.deepEqual(ben.topics, [{ topic: "Personal Branding", score: 100, mentions: 2, answers: 2, averagePosition: 1 }])
  assert.ok(ben.patterns.includes("books"))
})

test("buildImpulses: Platz zählt die eigene Person mit, Sortierung nach Score", () => {
  const answer = (names: string[]) => names.map((n, i) => `${i + 1}. **${n}** – Experte`).join("\n")
  const summary = buildImpulses(
    [
      { prompt: "a", response: answer(["Maud Schock", "Ben Schulz", "Felix Plötz"]), topic: "T" },
      { prompt: "b", response: answer(["Felix Plötz", "Ben Schulz"]), topic: "T" },
      { prompt: "c", response: answer(["Felix Plötz"]), topic: "T" },
    ],
    "Maud Schock",
  )
  const felix = summary.people.find(p => p.name === "Felix Plötz")!
  const ben = summary.people.find(p => p.name === "Ben Schulz")!
  assert.equal(felix.topics[0].averagePosition, 1.7) // Plätze 3, 1, 1
  assert.equal(ben.topics[0].averagePosition, 2)
  assert.deepEqual(summary.people.map(p => p.name), ["Felix Plötz", "Ben Schulz"])
})

test("Beschreibung: Klammer-Zusatz weg, Satzmitte und Abgeschnittenes verworfen", () => {
  assert.equal(cleanContext("(DFKI): einer der prägenden KI-Forscher"), null)
  assert.equal(cleanContext("(Schweiz/Zürich): Futurist mit Fokus auf Technologie und Ethik."), "Futurist mit Fokus auf Technologie und Ethik.")
  assert.equal(cleanContext("(Medien, KI) und Prof. Dr. Armin Grunwald sind oft zu hören."), null)
  assert.equal(cleanContext("Der Investor und G"), null)
  assert.equal(cleanContext("Satya Nadella, Jensen Huang, Je"), null)
})

test("buildImpulses: unter 10 % der Antworten zu einem Thema fällt raus", () => {
  const answers = Array.from({ length: 30 }, (_, i) => ({
    prompt: `q${i}`,
    response: i < 2 ? "1. **Gerd Leonhard** – Futurist\n2. **Miriam Meckel** – Professorin" : i < 11 ? "1. **Miriam Meckel** – Professorin" : "keine Namen",
    topic: "Digitalisierung",
  }))
  const summary = buildImpulses(answers, "Sascha Lobo")
  // Leonhard: 2 von 30 (< 3) → raus; Meckel: 11 von 30 → drin
  assert.deepEqual(summary.people.map(p => p.name), ["Miriam Meckel"])
})
