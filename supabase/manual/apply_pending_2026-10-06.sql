-- ─────────────────────────────────────────────────────────────────────────────
-- DigitalHalo: alle offenen Migrationen in EINEM Schritt (Stand 2026-10-06)
-- Im Supabase SQL-Editor einfügen und ausführen. Mehrfaches Ausführen ist
-- unschädlich (idempotent). Enthält:
--   1) Warteliste               (waitlist_signups)
--   2) Zielmärkte               (profiles.target_markets)
--   3) Kalibrierung             (calibration_runs)
--   4) Hintergrund-Analysejobs  (analysis_jobs)
--   5) Setup: bewertete Person  (profiles.subject_name)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1) Warteliste ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  source      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email ON public.waitlist_signups (lower(email));
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON public.waitlist_signups (created_at DESC);
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "waitlist_signups: admin read" ON public.waitlist_signups;
CREATE POLICY "waitlist_signups: admin read"
  ON public.waitlist_signups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 2) Zielmärkte ───────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_markets text[] NOT NULL DEFAULT '{}';

-- 3) Kalibrierung ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calibration_runs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_key         text        NOT NULL,
  kind              text        NOT NULL CHECK (kind IN ('positive','negative')),
  person_name       text        NOT NULL,
  topic             text        NOT NULL,
  language          text        NOT NULL,
  score             integer     NOT NULL,
  mention_rate      integer     NOT NULL,
  rounds            integer     NOT NULL,
  queries_per_round integer     NOT NULL,
  per_model         jsonb       NOT NULL DEFAULT '[]'::jsonb,
  flag              text,
  flag_detail       text,
  measured_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calibration_runs_entry ON public.calibration_runs (entry_key, measured_at DESC);
ALTER TABLE public.calibration_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calibration_runs: admin read" ON public.calibration_runs;
CREATE POLICY "calibration_runs: admin read"
  ON public.calibration_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 4) Hintergrund-Analysejobs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_id      uuid        NOT NULL REFERENCES public.monitoring_schedules(id) ON DELETE CASCADE,
  trigger          text        NOT NULL DEFAULT 'manual',
  advance_next_run boolean     NOT NULL DEFAULT false,
  status           text        NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  report_id        uuid,
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  started_at       timestamptz,
  finished_at      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_schedule ON public.analysis_jobs (schedule_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_profile  ON public.analysis_jobs (profile_id, created_at DESC);
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analysis_jobs: owner read" ON public.analysis_jobs;
CREATE POLICY "analysis_jobs: owner read"
  ON public.analysis_jobs FOR SELECT
  USING (profile_id = auth.uid());

-- 5) Setup: Name der bewerteten Person ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subject_name text;

COMMIT;
