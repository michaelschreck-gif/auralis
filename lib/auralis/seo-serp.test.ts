// lib/auralis/seo-serp.test.ts
// Tests für die Auswertung der Google-Trefferlisten.

import { test } from "node:test"
import assert from "node:assert/strict"
import { evaluateNameSearch, evaluateTopicSearch, googleSignals, rankToScore, type SerpItem } from "./seo-serp.ts"

const organic = (rank: number, title: string, url = `https://example${rank}.de/x`, description = ""): SerpItem => ({
  type: "organic", rank_absolute: rank, title, url, description,
})

const NAME_SEARCH: SerpItem[] = [
  { type: "knowledge_graph", title: "Sascha Lobo" },
  organic(1, "Sascha Lobo – Wikipedia", "https://de.wikipedia.org/wiki/Sascha_Lobo"),
  organic(2, "Kolumne", "https://saschalobo.com/", "Texte und Termine"),
  organic(3, "Sascha Lobo bei SPIEGEL"),
  organic(4, "Lobo-Fische im Aquarium"),
  organic(5, "Interview mit Sascha Lobo"),
  { type: "ai_overview", text: "Sascha Lobo ist ein deutscher Blogger." },
  organic(11, "Sascha Lobo auf Seite 2"),
]

test("Namenssuche: Treffer über die Person, eigene Website, Knowledge Panel, KI-Übersicht", () => {
  const r = evaluateNameSearch(NAME_SEARCH, "sascha lobo", "saschalobo.com")
  assert.equal(r.total, 6) // nur organische, Seite 2 (Rang 11) zählt mit, da < 10 Treffer davor
  assert.equal(r.aboutYou, 5) // Wikipedia, eigene Website, SPIEGEL, Interview, Seite 2 – nicht „Lobo-Fische“
  assert.equal(r.ownSiteRank, 2)
  assert.equal(r.knowledgePanel, true)
  assert.equal(r.aiOverview, true)
})

test("Namenssuche: nur die ersten 10 organischen Treffer zählen", () => {
  const items = Array.from({ length: 15 }, (_, i) => organic(i + 1, i < 12 ? "Ben Schulz Profil" : "anderes"))
  const r = evaluateNameSearch(items, "ben schulz", null)
  assert.equal(r.total, 10)
  assert.equal(r.aboutYou, 10)
})

test("Name + Thema: erster Treffer über die Person, sonst null", () => {
  const items = [organic(1, "Digitalisierung erklärt"), organic(2, "Sascha Lobo über Digitalisierung"), organic(3, "Sascha Lobo")]
  assert.equal(evaluateTopicSearch(items, "sascha lobo", null).position, 2)
  assert.equal(evaluateTopicSearch([organic(1, "Digitalisierung")], "sascha lobo", null).position, null)
})

test("Signale: Anteil, Ø-Platz (nicht gefunden = 0), Panel, KI-Übersicht", () => {
  const name = evaluateNameSearch(NAME_SEARCH, "sascha lobo", "saschalobo.com")
  const s = googleSignals(name, [
    { position: 1, url: null, aiOverview: false },
    { position: null, url: null, aiOverview: false },
  ])
  assert.deepEqual(s, { serpPresence: 50, serpPosition: 50, knowledgePanel: 100, aiOverview: 100 })
  assert.equal(rankToScore(10), 28)
})

test("Signale ohne Treffer: alles 0", () => {
  const name = evaluateNameSearch([organic(1, "anderes")], "ben schulz", null)
  assert.deepEqual(googleSignals(name, []), { serpPresence: 0, serpPosition: 0, knowledgePanel: 0, aiOverview: 0 })
})

test("Domain mit dem Namen zählt als Treffer über die Person, auch ohne hinterlegte Website", () => {
  const items = [organic(1, "saschalobo.com", "https://saschalobo.com/"), organic(2, "Startseite", "https://joergmueller-coaching.de/")]
  assert.equal(evaluateNameSearch(items, "sascha lobo", null).aboutYou, 1)
  assert.equal(evaluateNameSearch(items, "jörg müller", null).aboutYou, 1)
  // DataForSEO liefert Google-Weiterleitungen als url, die echte Domain steht in domain
  assert.equal(evaluateNameSearch([{ type: "organic", rank_group: 1, title: "Bücher", url: "https://google.com/goto?url=abc", domain: "saschalobo.com" }], "sascha lobo", null).aboutYou, 1)
  // … oder nur in der Pfadzeile
  const viaCrumb = evaluateNameSearch([{ type: "organic", rank_group: 1, title: "Bücher", url: "https://google.com/goto?url=abc", domain: "google.com", breadcrumb: "https://saschalobo.com › buecher" }], "sascha lobo", null)
  assert.equal(viaCrumb.aboutYou, 1)
  assert.equal(viaCrumb.results[0].domain, "saschalobo.com")
  // Gekürzte Pfadzeile ergibt keine Domain
  assert.equal(evaluateNameSearch([{ type: "organic", rank_group: 1, title: "x", url: "https://google.com/goto?url=a", breadcrumb: "ca. › x" }], "sascha lobo", null).results[0].domain, null)
  // Zu kurze Namen nicht über die Domain (Fehltreffer-Gefahr)
  assert.equal(evaluateNameSearch([organic(1, "Seite", "https://anna-li.de/")], "anna li", null).aboutYou, 0)
})

test("Platz unter den organischen Treffern (rank_group), nicht auf der Seite (rank_absolute)", () => {
  const items: SerpItem[] = [
    { type: "organic", rank_group: 1, rank_absolute: 3, title: "Digitalisierung" },
    { type: "organic", rank_group: 2, rank_absolute: 6, title: "Sascha Lobo zur Digitalisierung" },
  ]
  assert.equal(evaluateTopicSearch(items, "sascha lobo", null).position, 2)
  assert.deepEqual(evaluateNameSearch(items, "sascha lobo", null).results.map(r => r.rank), [1, 2])
})
