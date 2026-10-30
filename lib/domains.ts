// lib/domains.ts
// Aufteilung auf Domains:
//   digital-halo.de        → Webseite (Landingpage, Warteliste, Kontakt, Legal, API-Doku, öffentliche Profile)
//   app.digital-halo.de    → Tool (Login, Registrierung, Assistent, Personen, Konto)
//   admin.digital-halo.de  → Admin (/admin), optional über NEXT_PUBLIC_ADMIN_URL
// Aktiv nur, wenn NEXT_PUBLIC_SITE_URL und NEXT_PUBLIC_APP_URL gesetzt sind und die Anfrage
// auf einem dieser Hosts ankommt. *.vercel.app, Previews und localhost bleiben unverändert.
// /api/* und /badge/* laufen auf allen Domains (bestehende API-Integrationen und eingebettete Badges).

export type DomainConfig = {
  siteHost: string
  appHost: string
  siteOrigin: string
  appOrigin: string
  adminHost?: string
  adminOrigin?: string
}

export function domainConfigFromEnv(env: Record<string, string | undefined> = process.env): DomainConfig | null {
  const site = env.NEXT_PUBLIC_SITE_URL
  const app = env.NEXT_PUBLIC_APP_URL
  if (!site || !app) return null
  try {
    const s = new URL(site)
    const a = new URL(app)
    if (s.host === a.host) return null
    const cfg: DomainConfig = { siteHost: s.host, appHost: a.host, siteOrigin: s.origin, appOrigin: a.origin }
    if (env.NEXT_PUBLIC_ADMIN_URL) {
      const ad = new URL(env.NEXT_PUBLIC_ADMIN_URL)
      if (ad.host !== s.host && ad.host !== a.host) {
        cfg.adminHost = ad.host
        cfg.adminOrigin = ad.origin
      }
    }
    return cfg
  } catch {
    return null
  }
}

const TOOL_PREFIXES = [
  "/dashboard", "/onboarding", "/settings", "/login", "/auth", "/admin",
  "/registrieren", "/start", "/weiter", "/p", "/personen", "/konto",
]
const SITE_PREFIXES = ["/warteliste", "/kontakt", "/legal", "/docs", "/u"]
/** Auf der Admin-Domain erlaubt (Login und Auth gehören dazu). */
const ADMIN_PREFIXES = ["/admin", "/login", "/auth"]

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
  const onAdmin = !!cfg.adminHost && host === cfg.adminHost
  const isAdminPath = matchesPrefix(pathname, ["/admin"])

  if (onAdmin) {
    if (pathname === "/") return cfg.adminOrigin + "/admin" + search
    if (matchesPrefix(pathname, ADMIN_PREFIXES) || pathname.startsWith("/api/") || pathname.startsWith("/badge/")) return null
    if (isSitePath(pathname)) return cfg.siteOrigin + pathname + search
    return cfg.appOrigin + pathname + search
  }
  // Mit eigener Admin-Domain: /admin gehört dorthin.
  if (cfg.adminOrigin && isAdminPath && (onSite || onApp)) return cfg.adminOrigin + pathname + search

  if (onSite && isToolPath(pathname)) return cfg.appOrigin + pathname + search
  if (onApp && pathname === "/") return cfg.appOrigin + "/weiter" + search
  if (onApp && isSitePath(pathname)) return cfg.siteOrigin + pathname + search
  return null
}
