-- ─────────────────────────────────────────────────────────────────────────────
-- Live-Fortschritt je Mess-Job (lib/halo/progress.ts): Antworten je Modell,
-- Treffer und die letzten gestellten Fragen. Wird während der Messung laufend
-- überschrieben und von /api/jobs/[id] für die Fortschrittsanzeige gelesen.
-- Ältere Jobs bleiben leer (null).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.jobs add column if not exists progress jsonb;
