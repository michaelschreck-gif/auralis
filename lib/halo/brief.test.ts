// lib/halo/brief.test.ts
// Tests für den Wochenbrief (Betreff, Inhalt, wann keiner verschickt wird).

import { test } from "node:test"
import assert from "node:assert/strict"
import { buildBrief, isBriefDay, isoWeek, scoreAt, type BriefPerson } from "./brief.ts"
import type { Change } from "./changes.ts"

const LINKS = { unsubscribeUrl: "https://app.example/brief/abmelden?u=1&t=x", settingsUrl: null, imprintUrl: "https://example/legal/impressum" }

function change(text: string, tone: Change["tone"] = "good", weight = 80): Change {
  return { kind: "model_new", tone, text, weight, topicId: "t1", at: "2026-10-30T06:00:00Z" }
}

function person(over: Partial<BriefPerson> = {}): BriefPerson {
  return { name: "Maud Schock", url: "https://app.example/p/1", score: 41, band: "Aufbauend", delta: 3, changes: [], action: null, ...over }
}

test("scoreAt: letzter Punkt bis einschließlich Tag", () => {
  const h = [{ date: "2026-10-16", score: 30 }, { date: "2026-10-23", score: 35 }, { date: "2026-10-30", score: 41 }]
  assert.equal(scoreAt(h, "2026-10-23T08:00:00Z"), 35)
  assert.equal(scoreAt(h, "2026-10-01T00:00:00Z"), null)
})

test("Betreff für die Person selbst, für andere und fürs Team", () => {
  assert.equal(buildBrief({ ...LINKS, self: true, persons: [person()] })?.subject, "Dein Halo Score: 41 (+3)")
  assert.equal(buildBrief({ ...LINKS, self: false, persons: [person({ delta: 0, changes: [change("x")] })] })?.subject, "Halo Score Maud Schock: 41")
  const team = buildBrief({ ...LINKS, self: false, persons: [person({ changes: [change("a"), change("b")] }), person({ name: "Michael Schreck" })] })
  assert.equal(team?.subject, "Halo-Wochenbrief: 2 Personen, 2 Veränderungen")
})

test("höchstens drei Veränderungen, HTML maskiert Namen", () => {
  const b = buildBrief({
    ...LINKS,
    self: true,
    persons: [person({ changes: [change("eins"), change("zwei"), change("drei"), change("vier <b>")] })],
  })!
  assert.ok(b.text.includes("+ eins") && b.text.includes("+ drei"))
  assert.ok(!b.text.includes("vier"))
  assert.ok(b.html.includes(LINKS.unsubscribeUrl.replace("&", "&amp;")))
})

test("kein Brief ohne Messung oder ohne Neuigkeit", () => {
  assert.equal(buildBrief({ ...LINKS, self: true, persons: [person({ score: null })] }), null)
  assert.equal(buildBrief({ ...LINKS, self: true, persons: [person({ delta: 0 })] }), null)
  assert.ok(buildBrief({ ...LINKS, self: true, persons: [person({ delta: null, action: { title: "LinkedIn-Info ergänzen", url: "u" } })] }))
})

test("isoWeek und Montag nach deutscher Zeit", () => {
  assert.equal(isoWeek(new Date("2026-11-02T06:00:00Z")), "2026-W45")
  assert.equal(isoWeek(new Date("2027-01-01T06:00:00Z")), "2026-W53")
  assert.equal(isBriefDay(new Date("2026-11-02T06:00:00Z")), true)
  // Sonntag 23:30 UTC ist in Berlin schon Montag
  assert.equal(isBriefDay(new Date("2026-11-01T23:30:00Z")), true)
  assert.equal(isBriefDay(new Date("2026-11-03T06:00:00Z")), false)
})
