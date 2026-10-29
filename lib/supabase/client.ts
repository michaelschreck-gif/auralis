import { createBrowserClient } from "@supabase/ssr"
import type { HaloDatabase } from "./halo.types"

/** Supabase-Client im Browser (Login, Registrierung, Passwort setzen). */
export function createSupabaseBrowserClient() {
  return createBrowserClient<HaloDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}