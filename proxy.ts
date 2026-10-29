import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { crossDomainRedirect, domainConfigFromEnv } from "@/lib/domains"

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/start", "/weiter", "/p", "/personen", "/konto", "/admin"]

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Webseite (digital-halo.de) ↔ Tool (app.digital-halo.de) – siehe lib/domains.ts
  const host = request.headers.get("host") ?? ""
  const target = crossDomainRedirect(host, pathname, search, domainConfigFromEnv())
  if (target) return NextResponse.redirect(target, 308)

  const isProtected =
    PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/")) || pathname === "/settings"
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

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/weiter", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/", "/dashboard/:path*", "/onboarding/:path*", "/settings/:path*", "/login", "/registrieren",
    "/start", "/weiter", "/p/:path*", "/personen/:path*", "/konto/:path*",
    "/auth/:path*", "/admin/:path*",
    "/warteliste", "/kontakt", "/legal/:path*", "/docs/:path*", "/u/:path*",
  ],
}
