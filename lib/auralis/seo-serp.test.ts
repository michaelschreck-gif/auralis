// lib/auralis/seo-serp.test.ts
// Tests für die Auswertung der Google-Trefferlisten.

import { test } from "node:test"
import assert from "node:assert/strict"
import {
  evaluateNameSearch,
  evaluateTopicSearch,
  googleSignals,
  personMatcher,
  rankToScore,
  type SerpItem,
} from "./seo-serp.ts"

const organic = (rank: number, title: string, url = `https://example${rank}.de/x`, description = ""): SerpItem => ({
  type: "organic", rank_group: rank, title, url, description,
})

const lobo = personMatcher({
  name: "Sascha Lobo",
  websiteUrl: "https://saschalobo.com",
  context: "Autor und Digitalexperte",
  topics: ["Digitalisierung", "Social Media"],
})

test("Merkmale: Wörter ab 4 Buchstaben aus Rolle und Themen, gekürzt, ohne Füllwörter", () => {
  assert.deepEqual(lobo.keywords, ["autor", "digital", "social", "media"])
  assert.equal(lobo.ownHost, "saschalobo.com")
})

test("Namenssuche: Treffer über die Person, eigene Website, Knowledge Panel, KI-Übersicht", () => {
  const items: SerpItem[] = [
    { type: "knowledge_graph", title: "Sascha Lobo", sub_title: "Deutscher Autor" },
    organic(1, "Sascha Lobo – Wikipedia", "https://de.wikipedia.org/wiki/Sascha_Lobo", "deutscher Autor und Blogger"),
    organic(2, "Kolumne", "https://saschalobo.com/", "Texte und Termine"),
    organic(3, "Sascha Lobo bei SPIEGEL", undefined, "Kolumnen zur Digitalisierung"),
    organic(4, "Lobo-Fische im Aquarium"),
    organic(5, "Sascha Lobo", undefined, "Ein anderer Sascha Lobo, Bäcker in Köln"),
    { type: "ai_overview", text: "Sascha Lobo ist ein deutscher Blogger." },
  ]
  const r = evaluateNameSearch(items, lobo)
  assert.equal(r.total, 5)
  // Passendes Knowledge Panel („Autor“) → Name eindeutig → jeder Treffer mit vollem Namen zählt.
  assert.equal(r.unambiguous, true)
  assert.deepEqual(r.results.map(x => x.aboutYou), [true, true, true, false, true])
  assert.equal(r.ownSiteRank, 2)
  assert.equal(r.knowledgePanel, true)
  assert.equal(r.aiOverview, true)
})

test("Ohne Knowledge Panel braucht jeder Treffer ein zweites Merkmal", () => {
  const items = [
    organic(1, "Sascha Lobo – Wikipedia", "https://de.wikipedia.org/wiki/Sascha_Lobo", "deutscher Autor und Blogger"),
    organic(2, "Sascha Lobo", undefined, "Ein anderer Sascha Lobo, Bäcker in Köln"),
  ]
  const r = evaluateNameSearch(items, lobo)
  assert.equal(r.unambiguous, false)
  assert.deepEqual(r.results.map(x => x.aboutYou), [true, false])
})

test("Namensvettern bei häufigem Namen zählen nicht (realer Fall Michael Schreck)", () => {
  const m = personMatcher({ name: "Michael Schreck", context: "Social Data Analyst", topics: ["Data Analyst", "LinkedIn"] })
  const items = [
    organic(1, "Michael Schreck >> Jetzt finden!", "https://www.dastelefonbuch.de/x"),
    organic(2, "Michael Schreck - Entwicklungsingenieur", "https://www.xing.com/x"),
    organic(3, "Michael Schreck – Geschäftsführer bei August ...", "https://de.linkedin.com/in/x", "Michael Schreck · Erfahrung: August GmbH"),
    organic(4, "Michael Schreck Elektroinstallationen - Mainburg", "https://elektriker.org/x"),
    organic(5, "Michael Schreck bleibt verschwunden - Lohr", "https://www.mainpost.de/x"),
    organic(6, "Michael Schreck – Social Media & Data Analyst", "https://de.linkedin.com/in/y", "Social Data Analyst"),
  ]
  const r = evaluateNameSearch(items, m)
  // Nur der letzte passt (Rolle) – das fremde LinkedIn-Profil zählt trotz Thema „LinkedIn“ nicht.
  assert.deepEqual(r.results.map(x => x.aboutYou), [false, false, false, false, false, true])
})

test("Ohne Rolle und Themen reicht der Name", () => {
  const m = personMatcher({ name: "Ben Schulz" })
  assert.equal(evaluateNameSearch([organic(1, "Ben Schulz Profil")], m).aboutYou, 1)
})

test("Knowledge Panel eines Namensvetters zählt nicht", () => {
  const items: SerpItem[] = [{ type: "knowledge_graph", title: "Michael Schreck", sub_title: "Deutscher Fußballspieler" }]
  const m = personMatcher({ name: "Michael Schreck", context: "Social Data Analyst" })
  assert.equal(evaluateNameSearch(items, m).knowledgePanel, false)
})

test("Nur die ersten 10 organischen Treffer zählen", () => {
  const items = Array.from({ length: 15 }, (_, i) => organic(i + 1, "Ben Schulz Profil"))
  const r = evaluateNameSearch(items, personMatcher({ name: "Ben Schulz" }))
  assert.equal(r.total, 10)
  assert.equal(r.aboutYou, 10)
})

test("Name + Thema: erster Treffer über die Person, sonst null", () => {
  const items = [organic(1, "Digitalisierung erklärt"), organic(2, "Sascha Lobo über Digitalisierung"), organic(3, "Sascha Lobo")]
  assert.equal(evaluateTopicSearch(items, lobo).position, 2)
  assert.equal(evaluateTopicSearch([organic(1, "Digitalisierung")], lobo).position, null)
})

test("Signale: Anteil, Ø-Platz (nicht gefunden = 0), Panel, KI-Übersicht", () => {
  const name = evaluateNameSearch(
    [
      { type: "knowledge_graph", title: "Sascha Lobo" },
      ...Array.from({ length: 5 }, (_, i) => organic(i + 1, "Sascha Lobo, Autor")),
      { type: "ai_overview", text: "Sascha Lobo" },
    ],
    lobo,
  )
  const s = googleSignals(name, [
    { position: 1, url: null, aiOverview: false },
    { position: null, url: null, aiOverview: false },
  ])
  assert.deepEqual(s, { serpPresence: 50, serpPosition: 50, knowledgePanel: 100, aiOverview: 100 })
  assert.equal(rankToScore(10), 28)
})

test("Signale ohne Treffer: alles 0", () => {
  const name = evaluateNameSearch([organic(1, "anderes")], personMatcher({ name: "Ben Schulz" }))
  assert.deepEqual(googleSignals(name, []), { serpPresence: 0, serpPosition: 0, knowledgePanel: 0, aiOverview: 0 })
})

test("Domain mit dem Namen zählt, auch als Google-Weiterleitung oder nur in der Pfadzeile", () => {
  const plain = personMatcher({ name: "Sascha Lobo" })
  assert.equal(evaluateNameSearch([organic(1, "saschalobo.com", "https://saschalobo.com/")], plain).aboutYou, 1)
  assert.equal(evaluateNameSearch([organic(1, "Start", "https://joergmueller-coaching.de/")], personMatcher({ name: "Jörg Müller" })).aboutYou, 1)
  const viaDomain: SerpItem = { type: "organic", rank_group: 1, title: "Bücher", url: "https://google.com/goto?url=abc", domain: "saschalobo.com" }
  assert.equal(evaluateNameSearch([viaDomain], plain).aboutYou, 1)
  const viaCrumb = evaluateNameSearch(
    [{ type: "organic", rank_group: 1, title: "Bücher", url: "https://google.com/goto?url=abc", domain: "google.com", breadcrumb: "https://saschalobo.com › buecher" }],
    plain,
  )
  assert.equal(viaCrumb.aboutYou, 1)
  assert.equal(viaCrumb.results[0].domain, "saschalobo.com")
  // Gekürzte Pfadzeile ergibt keine Domain
  const cut = evaluateNameSearch([{ type: "organic", rank_group: 1, title: "x", url: "https://google.com/goto?url=a", breadcrumb: "ca. › x" }], plain)
  assert.equal(cut.results[0].domain, null)
  // Zu kurze Namen nicht über die Domain (Fehltreffer-Gefahr)
  assert.equal(evaluateNameSearch([organic(1, "Seite", "https://anna-li.de/")], personMatcher({ name: "Anna Li" })).aboutYou, 0)
})

test("Platz unter den organischen Treffern (rank_group), nicht auf der Seite (rank_absolute)", () => {
  const items: SerpItem[] = [
    { type: "organic", rank_group: 1, rank_absolute: 3, title: "Digitalisierung" },
    { type: "organic", rank_group: 2, rank_absolute: 6, title: "Sascha Lobo zur Digitalisierung" },
  ]
  assert.equal(evaluateTopicSearch(items, lobo).position, 2)
  assert.deepEqual(evaluateNameSearch(items, lobo).results.map(r => r.rank), [1, 2])
})
