/**
 * API v1 ist mit dem Neuaufbau (Konten und Personen statt Profilen und
 * Sub-Accounts) abgelöst. Alle v1-Pfade antworten mit 410 und verweisen auf v2.
 */

import { NextResponse } from "next/server"

function gone() {
  return NextResponse.json(
    {
      error: "API v1 wurde durch v2 ersetzt. Siehe https://digital-halo.de/docs/api",
      code: "API_VERSION_GONE",
      successor: "/api/v2",
    },
    { status: 410 },
  )
}

export const GET = gone
export const POST = gone
export const PUT = gone
export const PATCH = gone
export const DELETE = gone
