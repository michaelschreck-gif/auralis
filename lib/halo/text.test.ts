import { test } from "node:test"
import assert from "node:assert/strict"
import { countSourceDomains, domainOf, extractUrls, highlightName } from "./text.ts"

test("URLs: Satzzeichen am Ende werden entfernt", () => {
  assert.deepEqual(extractUrls("Siehe https://www.saschalobo.com/blog. Und (https://spiegel.de/x)."), [
    "https://www.saschalobo.com/blog",
    "https://spiegel.de/x",
  ])
  assert.equal(domainOf("https://www.Spiegel.de/a"), "spiegel.de")
  assert.equal(domainOf("kein link"), null)
})

test("Quellen: je Domain Nennungen und Antworten, sortiert", () => {
  const r = countSourceDomains([
    "https://a.de/1 und https://a.de/2",
    "https://b.de/x",
    "https://b.de/y https://a.de/3",
    "keine Quelle",
  ])
  assert.deepEqual(r, [
    { domain: "a.de", count: 3, answers: 2 },
    { domain: "b.de", count: 2, answers: 2 },
  ])
})

test("Name hervorheben: Vollname und Nachname als ganze Wörter", () => {
  const seg = highlightName("Sascha Lobo schreibt. Lobos Blog. Herr Lobo auch.", "Sascha", "Lobo")
  assert.deepEqual(seg.filter(s => s.match).map(s => s.text), ["Sascha Lobo", "Lobo"])
  assert.equal(seg.map(s => s.text).join(""), "Sascha Lobo schreibt. Lobos Blog. Herr Lobo auch.")
})

test("Name hervorheben: kurzer Nachname nur im Vollnamen", () => {
  const seg = highlightName("Max Li und Li", "Max", "Li")
  assert.deepEqual(seg.filter(s => s.match).map(s => s.text), ["Max Li"])
})
