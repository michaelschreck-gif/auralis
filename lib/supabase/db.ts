import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getLatestReport(profileId: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("visibility_reports")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}

export async function getScoreTrend(scheduleId: string, days = 30) {
  const supabase = await createSupabaseServerClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from("visibility_reports")
    .select("visibility_score, created_at")
    .eq("schedule_id", scheduleId)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
  return data ?? []
}

export async function getReportsForSchedules(scheduleIds: string[]) {
  if (scheduleIds.length === 0) return []
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("visibility_reports")
    .select("schedule_id, visibility_score, sentiment, created_at")
    .in("schedule_id", scheduleIds)
    .order("created_at", { ascending: false })
  return data ?? []
}
