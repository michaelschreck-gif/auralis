// lib/halo/mail.test.ts
// Tests: Fehlertexte des Mailversands enthalten nie den Resend-Schlüssel.

import { test } from "node:test"
import assert from "node:assert/strict"
import { redactMailError } from "./mail.ts"

test("Schlüssel wird aus der Meldung entfernt", () => {
  assert.equal(redactMailError("Resend 401: key re_abc123 invalid", "re_abc123"), "Resend 401: key *** invalid")
})

test("ungültiger Header-Wert: alles nach Bearer wird ausgeblendet", () => {
  const msg = `Headers.append: "Bearer await (async () => { const token = 'x' })()" is an invalid header value.`
  assert.equal(redactMailError(msg, "await (async"), `Headers.append: "Bearer ***`)
})

test("normale Fehler bleiben lesbar", () => {
  assert.equal(redactMailError("The operation was aborted due to timeout", "re_abc"), "The operation was aborted due to timeout")
})
