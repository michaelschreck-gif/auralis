// lib/halo/gold.test.ts
// Tests für die Prüfset-Auswertung.

import { test } from "node:test"
import assert from "node:assert/strict"
import { balancedSample, evaluateGold, type Detection, type GoldItem } from "./gold.ts"

const item = (id: string, labelMentioned: boolean, labelPosition: number | null = null, labelSentiment: GoldItem["labelSentiment"] = null): GoldItem => ({
  id, targetName: "Ben Schulz", prompt: "q", response: id, labelMentioned, labelPosition, labelSentiment,
})

// Erkennung je Antwort-ID vorgeben
const detector = (map: Record<string, Detection>) => (response: string) => map[response]

test("Nennung: Precision, Recall, Genauigkeit und Fehlerliste", () => {
  const ev = evaluateGold(
    [item("a", true), item("b", true), item("c", false), item("d", false)],
    detector({
      a: { mentioned: true, position: null, sentiment: "neutral" },
      b: { mentioned: false, position: null, sentiment: "not_mentioned" },
      c: { mentioned: true, position: 1, sentiment: "positive" },
      d: { mentioned: false, position: null, sentiment: "not_mentioned" },
    }),
  )
  assert.deepEqual(
    { tp: ev.mention.truePositive, fp: ev.mention.falsePositive, fn: ev.mention.falseNegative, tn: ev.mention.trueNegative },
    { tp: 1, fp: 1, fn: 1, tn: 1 },
  )
  assert.equal(ev.mention.precision, 0.5)
  assert.equal(ev.mention.recall, 0.5)
  assert.equal(ev.mention.accuracy, 0.5)
  assert.deepEqual(ev.mismatches.map(m => [m.id, m.kind]), [["b", "false_negative"], ["c", "false_positive"]])
})

test("Platz und Tonalität nur, wo beide ‚genannt‘ sagen", () => {
  const ev = evaluateGold(
    [item("a", true, 1, "positive"), item("b", true, 3, "neutral"), item("c", true, 2, "negative"), item("d", true, 4, "positive")],
    detector({
      a: { mentioned: true, position: 1, sentiment: "positive" },
      b: { mentioned: true, position: 4, sentiment: "positive" },
      c: { mentioned: true, position: null, sentiment: "neutral" },
      d: { mentioned: false, position: null, sentiment: "not_mentioned" },
    }),
  )
  assert.deepEqual(ev.position, { compared: 3, exact: 1, withinOne: 2, meanAbsError: 1 }) // Fehler 0 + 1 + 2 (kein Platz)
  assert.equal(ev.sentiment.compared, 3)
  assert.equal(ev.sentiment.agree, 1)
  assert.equal(ev.sentiment.confusion.neutral.positive, 1)
  assert.equal(ev.sentiment.confusion.negative.neutral, 1)
})

test("Leeres Prüfset liefert keine Quoten", () => {
  const ev = evaluateGold([], () => ({ mentioned: false, position: null, sentiment: "not_mentioned" }))
  assert.equal(ev.mention.precision, null)
  assert.equal(ev.mention.accuracy, null)
  assert.equal(ev.position.meanAbsError, null)
})

test("Stichprobe: halb/halb, solange beide Gruppen reichen", () => {
  let seed = 1
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const items = Array.from({ length: 40 }, (_, i) => ({ i, yes: i < 10 }))
  const sample = balancedSample(items, 10, x => x.yes, random)
  assert.equal(sample.length, 10)
  assert.equal(sample.filter(x => x.yes).length, 5)
  // Zu wenige „ja“: Rest wird mit „nein“ aufgefüllt
  const few = balancedSample(items.slice(8), 10, x => x.yes, random)
  assert.equal(few.filter(x => x.yes).length, 2)
  assert.equal(few.length, 10)
})
