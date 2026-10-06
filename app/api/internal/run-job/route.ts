/**
 * POST /api/internal/run-job — startet einen bereits angelegten Analyse-Job
 * in einer eigenen Funktionsinstanz (eigene 300 s). Wird vom Cron je fälligem
 * Thema aufgerufen, damit mehrere Themen parallel statt nacheinander in EINER
 * Funktion laufen. Antwortet sofort (202), der Lauf geschieht in after().
 * Auth: Bearer CRON_SECRET.
 */

import { NextRequest, NextResponse, after } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { executeAnalysisJob } from "@/lib/auralis/jobs"

export const maxDuration = 300

export async function POST(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json().catch(() => null) as { jobId?: string } | null
  if (!body?.jobId) {
    return NextResponse.json({ error: "jobId fehlt" }, { status: 400 })
  }
  const service = createSupabaseServiceClient()
  after(() => executeAnalysisJob(service, body.jobId!))
  return NextResponse.json({ accepted: true }, { status: 202 })
}
