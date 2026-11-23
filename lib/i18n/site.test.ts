// lib/i18n/site.test.ts
// Tests für Sprachpfade der Webseite (de / en / fr).

import { test } from "node:test"
import assert from "node:assert/strict"
import { LOCALES, SITE_ROUTES, alternatesFor, localeFromPath, routeOfPath, siteHref, toolHref } from "./site.ts"

test("Sprache aus Pfad", () => {
  assert.equal(localeFromPath("/"), "de")
  assert.equal(localeFromPath("/warteliste"), "de")
  assert.equal(localeFromPath("/en"), "en")
  assert.equal(localeFromPath("/en/legal/privacy"), "en")
  assert.equal(localeFromPath("/fr/cgv"), "fr")
  assert.equal(localeFromPath("/entwurf"), "de")
})

test("Jede Seite hat je Sprache eine eindeutige Adresse, und routeOfPath findet sie wieder", () => {
  const seen = new Set<string>()
  for (const [route, paths] of Object.entries(SITE_ROUTES)) {
    for (const l of LOCALES) {
      const p = (paths as Record<string, string>)[l]
      assert.ok(!seen.has(p), p)
      seen.add(p)
      assert.equal(routeOfPath(p), route, p)
      if (l !== "de") assert.ok(p === `/${l}` || p.startsWith(`/${l}/`), p)
    }
  }
  assert.equal(routeOfPath("/en/"), "home")
  assert.equal(routeOfPath("/p/123"), null)
})

test("Links ins Tool tragen die Sprache, Deutsch ohne Parameter", () => {
  assert.equal(toolHref("/registrieren", "de"), "/registrieren")
  assert.equal(toolHref("/login", "en", "https://app.digital-halo.de"), "https://app.digital-halo.de/login?lang=en")
  assert.equal(toolHref("/registrieren", "fr"), "/registrieren?lang=fr")
})

test("hreflang: alle Sprachen plus x-default auf Deutsch", () => {
  const a = alternatesFor("privacy", "fr")
  assert.equal(a.canonical, "/fr/legal/confidentialite")
  assert.deepEqual(a.languages, {
    de: "/legal/datenschutz", en: "/en/legal/privacy", fr: "/fr/legal/confidentialite", "x-default": "/legal/datenschutz",
  })
  assert.equal(siteHref("waitlist", "en"), "/en/waitlist")
})
