-- Kalibrierungsläufe: regelmäßige Messung von Kontrollpersonen mit festen Fragen
-- (siehe lib/auralis/calibration.ts). Geschrieben nur vom Cron (service_role),
-- lesbar für Admins.
CREATE TABLE public.calibration_runs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_key        text        NOT NULL,
  kind             text        NOT NULL CHECK (kind IN ('positive','negative')),
  person_name      text        NOT NULL,
  topic            text        NOT NULL,
  language         text        NOT NULL,
  score            integer     NOT NULL,
  mention_rate     integer     NOT NULL,
  rounds           integer     NOT NULL,
  queries_per_round integer    NOT NULL,
  per_model        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  flag             text,
  flag_detail      text,
  measured_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calibration_runs_entry ON public.calibration_runs (entry_key, measured_at DESC);

ALTER TABLE public.calibration_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calibration_runs: admin read"
  ON public.calibration_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
