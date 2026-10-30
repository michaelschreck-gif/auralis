// lib/halo/account-checks.test.ts
// Tests für den technischen Konten-Check.

import { test } from "node:test"
import assert from "node:assert/strict"
import { countBySeverity, findingsForUser, runAccountChecks, type CheckSnapshot } from "./account-checks.ts"

const now = new Date("2026-11-10T08:00:00Z")
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString()
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()

/** Ein gesundes Team-Konto: Owner + Mitglied, zwei Personen, gemessen. */
function healthy(): CheckSnapshot {
  return {
    now,
    googleConfigured: true,
    authUsers: [
      { id: "u1", email: "owner@x.de", created_at: daysAgo(30), last_sign_in_at: daysAgo(1), email_confirmed_at: daysAgo(30), invited_at: null, banned_until: null },
      { id: "u2", email: "member@x.de", created_at: daysAgo(20), last_sign_in_at: daysAgo(2), email_confirmed_at: daysAgo(20), invited_at: daysAgo(20), banned_until: null },
    ],
    appUsers: [
      { id: "u1", email: "owner@x.de", is_admin: false, banned_at: null },
      { id: "u2", email: "member@x.de", is_admin: false, banned_at: null },
    ],
    accounts: [{ id: "a1", type: "team", name: "Team X", owner_user_id: "u1" }],
    members: [
      { account_id: "a1", user_id: "u1", role: "owner", person_id: null },
      { account_id: "a1", user_id: "u2", role: "member", person_id: "p2" },
    ],
    persons: [
      { id: "p1", account_id: "a1", first_name: "Anna", last_name: "Muster", context: "Beraterin", website_url: null, created_at: daysAgo(30) },
      { id: "p2", account_id: "a1", first_name: "Ben", last_name: "Beispiel", context: null, website_url: "https://ben.de", created_at: daysAgo(20) },
    ],
    topics: [
      { id: "t1", person_id: "p1", name: "KI", is_active: true, next_run_at: daysAgo(-3), last_run_at: daysAgo(4), created_at: daysAgo(30) },
      { id: "t2", person_id: "p2", name: "Daten", is_active: true, next_run_at: daysAgo(-2), last_run_at: daysAgo(5), created_at: daysAgo(20) },
    ],
    jobs: [{ id: "j1", person_id: "p1", topic_id: "t1", status: "done", error: null, created_at: daysAgo(4) }],
    googleLatest: [
      { person_id: "p1", created_at: daysAgo(3) },
      { person_id: "p2", created_at: daysAgo(3) },
    ],
  }
}

const codes = (s: CheckSnapshot) => runAccountChecks(s).map(f => f.code)

test("Gesundes Team-Konto: keine Befunde", () => {
  assert.deepEqual(codes(healthy()), [])
})

test("Login ohne app_users-Eintrag und Eintrag ohne Login sind Fehler", () => {
  const s = healthy()
  s.appUsers = s.appUsers.filter(u => u.id !== "u2")
  s.appUsers.push({ id: "ghost", email: "weg@x.de", is_admin: false, banned_at: null })
  assert.deepEqual(codes(s).sort(), ["app_user_without_auth", "auth_without_app_user"])
})

test("Sperre widersprüchlich in beide Richtungen", () => {
  const s = healthy()
  s.authUsers[0].banned_until = daysAgo(-1000)
  s.appUsers[1].banned_at = daysAgo(1)
  const f = runAccountChecks(s).filter(x => x.code === "ban_mismatch")
  assert.deepEqual(f.map(x => x.userId).sort(), ["u1", "u2"])
})

test("Einladung offen nach 7 Tagen, unbestätigte E-Mail, kein Konto", () => {
  const s = healthy()
  s.authUsers.push({ id: "u3", email: "neu@x.de", created_at: daysAgo(9), last_sign_in_at: null, email_confirmed_at: null, invited_at: daysAgo(9), banned_until: null })
  s.appUsers.push({ id: "u3", email: "neu@x.de", is_admin: false, banned_at: null })
  s.authUsers.push({ id: "u4", email: "solo@x.de", created_at: daysAgo(5), last_sign_in_at: daysAgo(5), email_confirmed_at: daysAgo(5), invited_at: null, banned_until: null })
  s.appUsers.push({ id: "u4", email: "solo@x.de", is_admin: false, banned_at: null })
  const c = codes(s)
  assert.ok(c.includes("invite_pending"))
  assert.ok(c.includes("no_account"))
  // Einladung jünger als 7 Tage → noch kein Befund
  s.authUsers[2].invited_at = daysAgo(2)
  assert.ok(!codes(s).includes("invite_pending"))
})

test("Konto-Struktur: Owner fehlt, Zugang ohne Person, fremde Person, Einzelperson mit zwei Personen", () => {
  const s = healthy()
  s.members = [
    { account_id: "a1", user_id: "u2", role: "member", person_id: null },
  ]
  s.accounts.push({ id: "a2", type: "individual", name: "Solo", owner_user_id: "u1" })
  s.members.push({ account_id: "a2", user_id: "u1", role: "owner", person_id: null })
  s.members.push({ account_id: "a2", user_id: "u2", role: "member", person_id: "p1" }) // p1 gehört zu a1
  s.persons.push({ id: "p3", account_id: "a2", first_name: "C", last_name: "D", context: "x", website_url: null, created_at: daysAgo(30) })
  s.persons.push({ id: "p4", account_id: "a2", first_name: "E", last_name: "F", context: "x", website_url: null, created_at: daysAgo(30) })
  const c = codes(s)
  for (const code of ["owner_missing", "member_without_person", "member_person_foreign", "individual_multiple_persons"]) {
    assert.ok(c.includes(code), code)
  }
})

test("Messbetrieb: überfällig, nie gemessen, fehlgeschlagen, hängender Job", () => {
  const s = healthy()
  s.topics[0].next_run_at = daysAgo(2)
  s.topics[1].last_run_at = null
  s.jobs.push({ id: "j2", person_id: "p2", topic_id: "t2", status: "failed", error: "All providers failed", created_at: daysAgo(1) })
  s.jobs.push({ id: "j3", person_id: "p1", topic_id: "t1", status: "running", error: null, created_at: minutesAgo(25) })
  const c = codes(s)
  for (const code of ["topic_overdue", "topic_never_measured", "job_failed", "job_stuck"]) assert.ok(c.includes(code), code)
  // Fehler zuerst sortiert
  assert.equal(runAccountChecks(s)[0].severity, "error")
})

test("Google: fehlt, veraltet; ohne DataForSEO kein Befund", () => {
  const s = healthy()
  s.googleLatest = [{ person_id: "p1", created_at: daysAgo(20) }]
  assert.deepEqual(codes(s).filter(c => c.startsWith("google")).sort(), ["google_missing", "google_outdated"])
  s.googleConfigured = false
  assert.equal(codes(s).filter(c => c.startsWith("google")).length, 0)
})

test("Hinweis: Person ohne Rolle und Website", () => {
  const s = healthy()
  s.persons[0].context = null
  assert.deepEqual(codes(s), ["person_without_identity"])
})

test("Befunde je Nutzer über Konto-Zugehörigkeit, Zählung nach Schwere", () => {
  const s = healthy()
  s.topics[0].next_run_at = daysAgo(2)
  const all = runAccountChecks(s)
  assert.equal(findingsForUser(all, "u2", s.members).length, 1) // über Konto a1
  assert.deepEqual(countBySeverity(all), { error: 1, warning: 0, info: 0 })
})
