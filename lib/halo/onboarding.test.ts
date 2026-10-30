import { test } from "node:test"
import assert from "node:assert/strict"
import { accountNameFor, normalizeTopics, safeNextPath, validateStartInput } from "./onboarding.ts"

const valid = {
  accountType: "individual",
  teamName: "",
  firstName: "  Maud ",
  lastName: "Schock",
  context: "Personal-Branding-Beraterin",
  market: "dach",
  topics: ["Personal Branding"],
}

test("Themen: trimmen, Dubletten und Leere raus, Limit", () => {
  assert.deepEqual(normalizeTopics(["  KI ", "ki", "", "Leadership", "  ", "Vertrieb"], 5), ["KI", "Leadership", "Vertrieb"])
  assert.deepEqual(normalizeTopics(["a", "b", "c", "d"], 2), ["a", "b"])
  assert.deepEqual(normalizeTopics("kein Array", 5), [])
  assert.equal(normalizeTopics(["x".repeat(200)], 5)[0].length, 80)
})

test("Start: gültige Eingabe wird bereinigt", () => {
  const r = validateStartInput(valid, 5)
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.value.firstName, "Maud")
    assert.equal(r.value.accountType, "individual")
    assert.deepEqual(r.value.topics, ["Personal Branding"])
  }
})

test("Start: Pflichtfelder", () => {
  assert.equal(validateStartInput({ ...valid, accountType: "x" }, 5).ok, false)
  assert.equal(validateStartInput({ ...valid, lastName: " " }, 5).ok, false)
  assert.equal(validateStartInput({ ...valid, market: "mars" }, 5).ok, false)
  assert.equal(validateStartInput({ ...valid, topics: ["", " "] }, 5).ok, false)
})

test("Kontoname", () => {
  assert.equal(accountNameFor({ accountType: "individual", teamName: "", firstName: "Maud", lastName: "Schock" }), "Maud Schock")
  assert.equal(accountNameFor({ accountType: "team", teamName: "", firstName: "Maud", lastName: "Schock" }), "Team Schock")
  assert.equal(accountNameFor({ accountType: "team", teamName: "Halo", firstName: "Maud", lastName: "Schock" }), "Halo")
})

test("Weiterleitung nur auf interne Pfade", () => {
  assert.equal(safeNextPath("/start", "/weiter"), "/start")
  assert.equal(safeNextPath("//evil.com", "/weiter"), "/weiter")
  assert.equal(safeNextPath("https://evil.com", "/weiter"), "/weiter")
  assert.equal(safeNextPath("/\\evil.com", "/weiter"), "/weiter")
  assert.equal(safeNextPath(null, "/weiter"), "/weiter")
})
