/**
 * Datenbank-Typen für das neue Schema halo_v2
 * (supabase/migrations/20261029120000_halo_v2.sql).
 *
 * Von Hand gepflegt: jede Tabelle braucht Row, Insert, Update und
 * Relationships, sonst wird der ganze Database-Typ zu `never`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccountType = "individual" | "team"
export type MemberRole = "owner" | "member"
export type PlanType = "free" | "starter" | "pro" | "enterprise"
export type MarketId = "dach" | "us" | "uk" | "eu" | "ca" | "au" | "global"
export type FrequencyType = "daily" | "weekly" | "monthly"
export type TriggerType = "scheduled" | "manual"
export type SentimentType = "positive" | "neutral" | "negative"
export type JobStatus = "queued" | "running" | "done" | "failed"
export type ActionStatus = "open" | "done" | "dismissed"

/** Insert = Row, aber Spalten mit Default/nullable optional. */
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type Table<Row, Insert> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: []
}

export type AppUserRow = {
  id: string
  email: string | null
  is_admin: boolean
  banned_at: string | null
  weekly_brief: boolean
  created_at: string
}

export type BriefSendRow = {
  id: string
  user_id: string
  week: string
  status: "sending" | "sent" | "skipped" | "failed"
  error: string | null
  payload: Json | null
  created_at: string
}

export type AccountRow = {
  id: string
  type: AccountType
  name: string
  owner_user_id: string
  plan: PlanType
  created_at: string
}

export type AccountMemberRow = {
  account_id: string
  user_id: string
  role: MemberRole
  person_id: string | null
  created_at: string
}

export type PersonRow = {
  id: string
  account_id: string
  first_name: string
  last_name: string
  context: string | null
  market: MarketId
  website_url: string | null
  public_slug: string | null
  public_profile_enabled: boolean
  created_at: string
  updated_at: string
}

export type TopicRow = {
  id: string
  person_id: string
  name: string
  is_active: boolean
  frequency: FrequencyType
  next_run_at: string
  last_run_at: string | null
  created_at: string
}

export type MeasurementRow = {
  id: string
  person_id: string
  topic_id: string | null
  trigger: TriggerType
  ai_score: number | null
  perception_score: number | null
  sentiment: SentimentType | null
  models_ok: number
  models_total: number
  stability: Json | null
  summary: string | null
  raw: Json | null
  created_at: string
}

export type MeasurementAnswerRow = {
  id: string
  measurement_id: string
  person_id: string
  model: string
  query_type: string | null
  prompt: string
  response: string | null
  mentioned: boolean
  position: number | null
  sentiment: SentimentType | null
  latency_ms: number | null
  tokens_used: number | null
  input_tokens: number | null
  output_tokens: number | null
  created_at: string
}

export type GoogleMeasurementRow = {
  id: string
  person_id: string
  source: string
  score: number | null
  signals: Json | null
  raw: Json | null
  created_at: string
}

export type JobRow = {
  id: string
  person_id: string
  topic_id: string
  trigger: TriggerType
  advance_next_run: boolean
  status: JobStatus
  measurement_id: string | null
  error: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export type CompetitorRow = {
  id: string
  person_id: string
  name: string
  topics: string[]
  market: MarketId
  created_at: string
}

export type CompetitorMeasurementRow = {
  id: string
  competitor_id: string
  person_id: string
  ai_score: number | null
  raw: Json | null
  created_at: string
}

export type ActionRow = {
  id: string
  person_id: string
  measurement_id: string | null
  title: string
  detail: string | null
  category: string | null
  impact: string | null
  status: ActionStatus
  score_before: number | null
  score_after: number | null
  created_at: string
  done_at: string | null
}

export type PersonaSnapshotRow = {
  id: string
  person_id: string
  measurement_id: string | null
  roles: Json
  summary: string | null
  model: string | null
  created_at: string
}

export type ApiKeyRow = {
  id: string
  account_id: string
  name: string
  key_hash: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export type ApiUsageRow = {
  account_id: string
  day: string
  count: number
}

export type AuditLogRow = {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  target_type: string | null
  target_id: string | null
  payload: Json | null
  created_at: string
}

export type GoldSentiment = "positive" | "neutral" | "negative"

/** Prüfset: echte Antwort + Bewertung von Hand (supabase/migrations/20261030120000_gold_answers.sql). */
export type GoldAnswerRow = {
  id: string
  source: "measurement" | "legacy"
  source_id: string
  target_name: string
  topic: string | null
  model: string | null
  query_type: string | null
  prompt: string
  response: string
  label_mentioned: boolean | null
  label_position: number | null
  label_sentiment: GoldSentiment | null
  label_note: string | null
  excluded: boolean
  labeled_by: string | null
  labeled_at: string | null
  created_at: string
}

export type CalibrationRunRow = {
  id: string
  entry_key: string
  kind: "positive" | "negative"
  person_name: string
  topic: string
  language: string
  score: number
  mention_rate: number
  rounds: number
  queries_per_round: number
  per_model: Json
  flag: string | null
  flag_detail: string | null
  measured_at: string
}

export type WaitlistSignupRow = {
  id: string
  email: string
  source: string | null
  created_at: string
}

export type HaloDatabase = {
  public: {
    Tables: {
      app_users: Table<AppUserRow, WithOptional<AppUserRow, "email" | "is_admin" | "banned_at" | "weekly_brief" | "created_at">>
      accounts: Table<AccountRow, WithOptional<AccountRow, "id" | "plan" | "created_at">>
      account_members: Table<AccountMemberRow, WithOptional<AccountMemberRow, "person_id" | "created_at">>
      persons: Table<
        PersonRow,
        WithOptional<
          PersonRow,
          "id" | "context" | "market" | "website_url" | "public_slug" | "public_profile_enabled" | "created_at" | "updated_at"
        >
      >
      topics: Table<
        TopicRow,
        WithOptional<TopicRow, "id" | "is_active" | "frequency" | "next_run_at" | "last_run_at" | "created_at">
      >
      measurements: Table<
        MeasurementRow,
        WithOptional<
          MeasurementRow,
          | "id"
          | "topic_id"
          | "ai_score"
          | "perception_score"
          | "sentiment"
          | "models_ok"
          | "models_total"
          | "stability"
          | "summary"
          | "raw"
          | "created_at"
        >
      >
      measurement_answers: Table<
        MeasurementAnswerRow,
        WithOptional<
          MeasurementAnswerRow,
          | "id" | "query_type" | "response" | "mentioned" | "position" | "sentiment" | "latency_ms" | "tokens_used"
          | "input_tokens" | "output_tokens" | "created_at"
        >
      >
      google_measurements: Table<
        GoogleMeasurementRow,
        WithOptional<GoogleMeasurementRow, "id" | "score" | "signals" | "raw" | "created_at">
      >
      jobs: Table<
        JobRow,
        WithOptional<
          JobRow,
          "id" | "advance_next_run" | "status" | "measurement_id" | "error" | "created_at" | "started_at" | "finished_at"
        >
      >
      competitors: Table<CompetitorRow, WithOptional<CompetitorRow, "id" | "topics" | "market" | "created_at">>
      competitor_measurements: Table<
        CompetitorMeasurementRow,
        WithOptional<CompetitorMeasurementRow, "id" | "ai_score" | "raw" | "created_at">
      >
      actions: Table<
        ActionRow,
        WithOptional<
          ActionRow,
          | "id"
          | "measurement_id"
          | "detail"
          | "category"
          | "impact"
          | "status"
          | "score_before"
          | "score_after"
          | "created_at"
          | "done_at"
        >
      >
      persona_snapshots: Table<
        PersonaSnapshotRow,
        WithOptional<PersonaSnapshotRow, "id" | "measurement_id" | "roles" | "summary" | "model" | "created_at">
      >
      api_keys: Table<ApiKeyRow, WithOptional<ApiKeyRow, "id" | "created_at" | "last_used_at" | "revoked_at">>
      api_usage: Table<ApiUsageRow, WithOptional<ApiUsageRow, "day" | "count">>
      audit_log: Table<
        AuditLogRow,
        WithOptional<AuditLogRow, "id" | "actor_id" | "actor_email" | "target_type" | "target_id" | "payload" | "created_at">
      >
      calibration_runs: Table<
        CalibrationRunRow,
        WithOptional<CalibrationRunRow, "id" | "per_model" | "flag" | "flag_detail" | "measured_at">
      >
      waitlist_signups: Table<WaitlistSignupRow, WithOptional<WaitlistSignupRow, "id" | "source" | "created_at">>
      gold_answers: Table<
        GoldAnswerRow,
        WithOptional<
          GoldAnswerRow,
          | "id" | "topic" | "model" | "query_type" | "label_mentioned" | "label_position" | "label_sentiment"
          | "label_note" | "excluded" | "labeled_by" | "labeled_at" | "created_at"
        >
      >
      brief_sends: Table<BriefSendRow, WithOptional<BriefSendRow, "id" | "status" | "error" | "payload" | "created_at">>
    }
    Views: { [_ in never]: never }
    Functions: {
      can_access_person: { Args: { p_person_id: string }; Returns: boolean }
      is_account_owner: { Args: { p_account_id: string }; Returns: boolean }
      is_account_member: { Args: { p_account_id: string }; Returns: boolean }
      is_app_admin: { Args: Record<string, never>; Returns: boolean }
      create_account: { Args: { p_type: AccountType; p_name: string }; Returns: string }
      increment_api_usage: { Args: { p_account_id: string }; Returns: number }
      get_due_topics: { Args: Record<string, never>; Returns: TopicRow[] }
    }
    Enums: {
      account_type: AccountType
      member_role: MemberRole
      plan_type: PlanType
      market_id: MarketId
      frequency_type: FrequencyType
      trigger_type: TriggerType
      sentiment_type: SentimentType
      job_status: JobStatus
      action_status: ActionStatus
    }
    CompositeTypes: { [_ in never]: never }
  }
}
