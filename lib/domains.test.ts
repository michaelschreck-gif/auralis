// lib/domains.test.ts
// Tests für die Domain-Aufteilung Webseite (digital-halo.de) ↔ Tool (app.digital-halo.de).

import { test } from "node:test"
import assert from "node:assert/strict"
import { crossDomainRedirect, domainConfigFromEnv } from "./domains.ts"

const cfg = domainConfigFromEnv({
  NEXT_PUBLIC_SITE_URL: "https://digital-halo.de",
  NEXT_PUBLIC_APP_URL: "https://app.digital-halo.de",
})

test("Konfiguration: nur aktiv mit beiden URLs auf verschiedenen Hosts", () => {
  assert.ok(cfg)
  assert.equal(domainConfigFromEnv({}), null)
  assert.equal(domainConfigFromEnv({ NEXT_PUBLIC_SITE_URL: "https://digital-halo.de" }), null)
  assert.equal(domainConfigFromEnv({ NEXT_PUBLIC_SITE_URL: "https://x.de", NEXT_PUBLIC_APP_URL: "https://x.de" }), null)
  assert.equal(domainConfigFromEnv({ NEXT_PUBLIC_SITE_URL: "kaputt", NEXT_PUBLIC_APP_URL: "https://app.x.de" }), null)
})

test("Webseite: Tool-Pfade gehen auf app-Domain, mit Query", () => {
  assert.equal(crossDomainRedirect("digital-halo.de", "/login", "", cfg), "https://app.digital-halo.de/login")
  assert.equal(crossDomainRedirect("digital-halo.de", "/dashboard/geo", "?x=1", cfg), "https://app.digital-halo.de/dashboard/geo?x=1")
  assert.equal(crossDomainRedirect("www.digital-halo.de", "/settings", "", cfg), "https://app.digital-halo.de/settings")
  assert.equal(crossDomainRedirect("digital-halo.de", "/auth/callback", "?code=abc", cfg), "https://app.digital-halo.de/auth/callback?code=abc")
  for (const p of ["/registrieren", "/start", "/weiter", "/p/123", "/personen", "/konto"]) {
    assert.equal(crossDomainRedirect("digital-halo.de", p, "", cfg), `https://app.digital-halo.de${p}`, p)
  }
  // keine Präfix-Falle: /preise ist kein Tool-Pfad (beginnt nur mit /p)
  assert.equal(crossDomainRedirect("digital-halo.de", "/preise", "", cfg), null)
})

test("Webseite: eigene Seiten, API und Badges bleiben", () => {
  for (const p of ["/", "/warteliste", "/legal/impressum", "/docs/api", "/u/elon-musk", "/api/v1/me", "/badge/elon-musk"]) {
    assert.equal(crossDomainRedirect("digital-halo.de", p, "", cfg), null, p)
  }
  // keine Präfix-Falle: /dashboarding ist kein Tool-Pfad
  assert.equal(crossDomainRedirect("digital-halo.de", "/dashboarding", "", cfg), null)
})

test("App: Startseite → /weiter, Webseiten-Pfade → Webseite", () => {
  assert.equal(crossDomainRedirect("app.digital-halo.de", "/", "", cfg), "https://app.digital-halo.de/weiter")
  assert.equal(crossDomainRedirect("app.digital-halo.de", "/warteliste", "", cfg), "https://digital-halo.de/warteliste")
  assert.equal(crossDomainRedirect("app.digital-halo.de", "/legal/agb", "", cfg), "https://digital-halo.de/legal/agb")
  for (const p of ["/dashboard", "/login", "/settings", "/api/v1/me", "/badge/x"]) {
    assert.equal(crossDomainRedirect("app.digital-halo.de", p, "", cfg), null, p)
  }
})

const withAdmin = domainConfigFromEnv({
  NEXT_PUBLIC_SITE_URL: "https://digital-halo.de",
  NEXT_PUBLIC_APP_URL: "https://app.digital-halo.de",
  NEXT_PUBLIC_ADMIN_URL: "https://admin.digital-halo.de",
})

test("Admin-Domain: Startseite → /admin, Login/Auth/API bleiben, Rest auf Tool bzw. Webseite", () => {
  assert.equal(crossDomainRedirect("admin.digital-halo.de", "/", "", withAdmin), "https://admin.digital-halo.de/admin")
  for (const p of ["/admin", "/admin/nutzer", "/login", "/auth/callback", "/api/admin/calibration"]) {
    assert.equal(crossDomainRedirect("admin.digital-halo.de", p, "", withAdmin), null, p)
  }
  assert.equal(crossDomainRedirect("admin.digital-halo.de", "/weiter", "", withAdmin), "https://app.digital-halo.de/weiter")
  assert.equal(crossDomainRedirect("admin.digital-halo.de", "/legal/agb", "", withAdmin), "https://digital-halo.de/legal/agb")
})

test("Admin-Domain: /admin auf Tool oder Webseite geht zur Admin-Domain", () => {
  assert.equal(crossDomainRedirect("app.digital-halo.de", "/admin/konten", "?q=x", withAdmin), "https://admin.digital-halo.de/admin/konten?q=x")
  assert.equal(crossDomainRedirect("digital-halo.de", "/admin", "", withAdmin), "https://admin.digital-halo.de/admin")
  // ohne Admin-Domain bleibt /admin im Tool
  assert.equal(crossDomainRedirect("app.digital-halo.de", "/admin", "", cfg), null)
})

test("Andere Hosts (vercel.app, Previews, localhost) und fehlende Konfiguration: keine Umleitung", () => {
  assert.equal(crossDomainRedirect("auralis-plum.vercel.app", "/login", "", cfg), null)
  assert.equal(crossDomainRedirect("localhost:3000", "/", "", cfg), null)
  assert.equal(crossDomainRedirect("digital-halo.de", "/login", "", null), null)
})
