// lib/domains.ts
// Aufteilung Webseite ↔ Tool auf zwei Domains:
//   digital-halo.de      → Webseite (Landingpage, Warteliste, Kontakt, Legal, API-Doku, öffentliche Profile)
//   app.digital-halo.de  → Tool (Login, Registrierung, Assistent, Personen, Konto, Admin)
// Aktiv nur, wenn NEXT_PUBLIC_SITE_URL und NEXT_PUBLIC_APP_URL gesetzt sind und die Anfrage
// auf einem dieser beiden Hosts ankommt. *.vercel.app, Previews und localhost bleiben unverändert.
// /api/* und /badge/* laufen auf beiden Domains (bestehende API-Integrationen und eingebettete Badges).

export type DomainConfig = { siteHost: string; appHost: string; siteOrigin: string; appOrigin: string }

export function domainConfigFromEnv(env: Record<string, string | undefined> = process.env): DomainConfig | null {
  const site = env.NEXT_PUBLIC_SITE_URL
  const app = env.NEXT_PUBLIC_APP_URL
  if (!site || !app) return null
  try {
    const s = new URL(site)
    const a = new URL(app)
    if (s.host === a.host) return null
    return { siteHost: s.host, appHost: a.host, siteOrigin: s.origin, appOrigin: a.origin }
  } catch {
    return null
  }
}

const TOOL_PREFIXES = [
  "/dashboard", "/onboarding", "/settings", "/login", "/auth", "/admin",
  "/registrieren", "/start", "/weiter", "/p", "/personen", "/konto",
]
const SITE_PREFIXES = ["/warteliste", "/kontakt", "/legal", "/docs", "/u"]

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + "/"))
}

export function isToolPath(pathname: string): boolean {
  return matchesPrefix(pathname, TOOL_PREFIXES)
}

export function isSitePath(pathname: string): boolean {
  return pathname === "/" || matchesPrefix(pathname, SITE_PREFIXES)
}

/** Ziel-URL, falls die Anfrage auf die andere Domain gehört; sonst null. */
export function crossDomainRedirect(host: string, pathname: string, search: string, cfg: DomainConfig | null): string | null {
  if (!cfg) return null
  // www.digital-halo.de wird wie die Webseite behandelt
  const onSite = host === cfg.siteHost || host === `www.${cfg.siteHost}`
  const onApp = host === cfg.appHost

  if (onSite && isToolPath(pathname)) return cfg.appOrigin + pathname + search
  if (onApp && pathname === "/") return cfg.appOrigin + "/weiter" + search
  if (onApp && isSitePath(pathname)) return cfg.siteOrigin + pathname + search
  return null
}
