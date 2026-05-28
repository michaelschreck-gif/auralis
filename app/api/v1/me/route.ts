/**
 * GET /api/v1/me
 *
 * Returns the authenticated user's profile basics. Useful for the API
 * consumer to verify the token is valid and see which account it belongs to.
 *
 * Response 200:
 *   {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "full_name": "Display Name",
 *     "plan": "pro",
 *     "language": "de"
 *   }
 */

import { NextResponse } from "next/server"
import { authenticateApiKey } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const { profile } = auth
  return NextResponse.json({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    plan: profile.plan,
    language: profile.language,
  })
}
