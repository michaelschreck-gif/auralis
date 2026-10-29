import { createServerClient } from "@supabase/ssr"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { HaloDatabase } from "./halo.types"

/** Supabase-Client für das neue Schema (halo_v2). */
export type HaloClient = SupabaseClient<HaloDatabase>

// Server-side only — uses service role key, bypasses RLS
export function createHaloServiceClient(): HaloClient {
  return createClient<HaloDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/** Client mit der Sitzung des angemeldeten Nutzers (RLS greift). */
export async function createHaloServerClient(): Promise<HaloClient> {
  const cookieStore = await cookies()
  return createServerClient<HaloDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {}
        },
      },
    },
  )
}
