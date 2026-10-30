import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { crossDomainRedirect, domainConfigFromEnv } from "@/lib/domains"
import { safeNextPath } from "@/lib/halo/onboarding"

const PROTECTED_PREFIXES = ["/start", "/weiter", "/p", "/personen", "/konto", "/admin"]

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Webseite (digital-halo.de) ↔ Tool (app.digital-halo.de) – siehe lib/domains.ts
  const host = request.headers.get("host") ?? ""
  const target = crossDomainRedirect(host, pathname, search, domainConfigFromEnv())
  if (target) return NextResponse.redirect(target, 308)

  const isProtected = PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"))
  const isAuthPage = pathname === "/login" || pathname === "/registrieren"
  if (!isProtected && !isAuthPage) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Ziel nach dem Login mitgeben – auf admin.digital-halo.de sonst /weiter → Tool-Domain ohne Sitzung.
  if (!user && isProtected) {
    const login = new URL("/login", request.url)
    login.searchParams.set("next", pathname + search)
    return NextResponse.redirect(login)
  }

  if (user && isAuthPage) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"), "/weiter")
    return NextResponse.redirect(new URL(next, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/", "/login", "/registrieren",
    "/start", "/weiter", "/p/:path*", "/personen/:path*", "/konto/:path*",
    "/auth/:path*", "/admin/:path*",
    "/warteliste", "/kontakt", "/legal/:path*", "/docs/:path*", "/u/:path*",
  ],
}
