// lib/halo/company.test.ts
// Tests: Unternehmen in KI-Antworten (Corporate Ambassadors).

import { test } from "node:test"
import assert from "node:assert/strict"
import { companyMentionStats, mentionsCompany, normalizeCompany, percent, sumCompanyMentions } from "./company.ts"

test("Rechtsform wird abgeschnitten, zu kurze Namen verworfen", () => {
  assert.equal(normalizeCompany("Nordlicht Energie GmbH"), "Nordlicht Energie")
  assert.equal(normalizeCompany("Leadesk UG (haftungsbeschränkt)"), "Leadesk")
  assert.equal(normalizeCompany("Muster GmbH & Co. KG"), "Muster")
  assert.equal(normalizeCompany("  Acme,  Inc. "), "Acme")
  assert.equal(normalizeCompany("entrenous"), "entrenous")
  assert.equal(normalizeCompany("AB GmbH"), "")
  assert.equal(normalizeCompany(null), "")
})

test("Nennung nur als ganzes Wort, unabhängig von Schreibweise und Rechtsform", () => {
  assert.equal(mentionsCompany("Lena Brandt von NORDLICHT ENERGIE gilt als…", "Nordlicht Energie GmbH"), true)
  assert.equal(mentionsCompany("Sie arbeitet bei Nordlicht\nEnergie.", "Nordlicht Energie"), true)
  assert.equal(mentionsCompany("Die Nordlichtenergie-Branche …", "Nordlicht"), false)
  assert.equal(mentionsCompany("Kein Treffer hier.", "Nordlicht"), false)
})

test("Zählt Unternehmen, Person und gemeinsame Nennungen", () => {
  const s = companyMentionStats(
    [
      { text: "Lena Brandt (Nordlicht Energie)", personMentioned: true },
      { text: "Nordlicht Energie ist führend", personMentioned: false },
      { text: "Lena Brandt", personMentioned: true },
      { text: "Andere Firma", personMentioned: false },
    ],
    "Nordlicht Energie GmbH",
  )
  assert.deepEqual(s, { company: "Nordlicht Energie", answers: 4, companyMentioned: 2, personMentioned: 2, together: 1 })
  assert.equal(companyMentionStats([], "Nordlicht"), null)
  assert.equal(companyMentionStats([{ text: "x", personMentioned: false }], ""), null)
})

test("Summe über Themen und Prozent", () => {
  const a = { company: "Nordlicht", answers: 10, companyMentioned: 3, personMentioned: 4, together: 2 }
  const b = { company: "Nordlicht", answers: 10, companyMentioned: 1, personMentioned: 2, together: 1 }
  assert.deepEqual(sumCompanyMentions([a, null, b]), { company: "Nordlicht", answers: 20, companyMentioned: 4, personMentioned: 6, together: 3 })
  assert.equal(sumCompanyMentions([null, undefined]), null)
  assert.equal(percent(3, 20), 15)
  assert.equal(percent(1, 0), 0)
})
