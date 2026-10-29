-- Analyse-Jobs: Messläufe laufen im Hintergrund (Vercel after()), die Oberfläche
-- fragt den Status per Polling ab. Geschrieben nur mit service_role.
CREATE TABLE public.analysis_jobs (
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

CREATE INDEX idx_analysis_jobs_schedule ON public.analysis_jobs (schedule_id, created_at DESC);
CREATE INDEX idx_analysis_jobs_profile  ON public.analysis_jobs (profile_id, created_at DESC);

ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analysis_jobs: owner read"
  ON public.analysis_jobs FOR SELECT
  USING (profile_id = auth.uid());
