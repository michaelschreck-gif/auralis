-- ─────────────────────────────────────────────────────────────────────────────
-- Auralis – Complete Database Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extensions
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Enums
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.plan_type AS ENUM (
  'free',
  'starter',
  'pro',
  'enterprise'
);

CREATE TYPE public.language_type AS ENUM (
  'de',
  'en',
  'fr',
  'es',
  'it',
  'nl',
  'pt'
);

CREATE TYPE public.frequency_type AS ENUM (
  'daily',
  'weekly',
  'monthly'
);

CREATE TYPE public.sentiment_type AS ENUM (
  'positive',
  'neutral',
  'negative'
);

CREATE TYPE public.trigger_type AS ENUM (
  'scheduled',
  'manual',
  'webhook'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles: extends auth.users 1:1
CREATE TABLE public.profiles (
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          text        NOT NULL,
  full_name      text,
  avatar_url     text,
  plan           public.plan_type NOT NULL DEFAULT 'free',
  language       public.language_type NOT NULL DEFAULT 'de',
  timezone       text        NOT NULL DEFAULT 'Europe/Berlin',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- monitoring_schedules: one schedule per brand/query combo
CREATE TABLE public.monitoring_schedules (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  query          text        NOT NULL,
  frequency      public.frequency_type NOT NULL DEFAULT 'weekly',
  language       public.language_type NOT NULL DEFAULT 'de',
  is_active      boolean     NOT NULL DEFAULT true,
  next_run_at    timestamptz NOT NULL DEFAULT now(),
  last_run_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- visibility_reports: aggregated report per schedule run
CREATE TABLE public.visibility_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_id     uuid        REFERENCES public.monitoring_schedules(id) ON DELETE SET NULL,
  trigger         public.trigger_type NOT NULL DEFAULT 'scheduled',
  visibility_score numeric(5,2),
  sentiment       public.sentiment_type,
  summary         text,
  raw_data        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- query_results: individual AI model answers per report
CREATE TABLE public.query_results (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id       uuid        NOT NULL REFERENCES public.visibility_reports(id) ON DELETE CASCADE,
  model           text        NOT NULL,
  prompt          text        NOT NULL,
  response        text,
  brand_mentioned boolean     NOT NULL DEFAULT false,
  sentiment       public.sentiment_type,
  position        smallint,
  tokens_used     integer,
  latency_ms      integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_monitoring_schedules_profile_id
  ON public.monitoring_schedules (profile_id);

CREATE INDEX idx_monitoring_schedules_next_run_at
  ON public.monitoring_schedules (next_run_at)
  WHERE is_active = true;

CREATE INDEX idx_visibility_reports_profile_id
  ON public.visibility_reports (profile_id);

CREATE INDEX idx_visibility_reports_schedule_id
  ON public.visibility_reports (schedule_id);

CREATE INDEX idx_query_results_profile_id
  ON public.query_results (profile_id);

CREATE INDEX idx_query_results_report_id
  ON public.query_results (report_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visibility_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_results        ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: owner read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- monitoring_schedules
CREATE POLICY "schedules: owner all"
  ON public.monitoring_schedules FOR ALL
  USING (auth.uid() = profile_id);

-- visibility_reports
CREATE POLICY "reports: owner all"
  ON public.visibility_reports FOR ALL
  USING (auth.uid() = profile_id);

-- query_results
CREATE POLICY "query_results: owner all"
  ON public.query_results FOR ALL
  USING (auth.uid() = profile_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Auth Trigger: handle_new_user
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Function: get_due_schedules()
-- Returns all active schedules whose next_run_at is in the past
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_due_schedules()
RETURNS SETOF public.monitoring_schedules
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.monitoring_schedules
  WHERE is_active = true
    AND next_run_at <= now()
  ORDER BY next_run_at ASC;
$$;
