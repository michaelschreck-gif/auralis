-- ─────────────────────────────────────────────────────────────────────────────
-- Prüfset: echte KI-Antworten, von Hand bewertet (genannt? Platz? Tonalität?).
-- Damit wird gemessen, wie genau die automatische Erkennung (analyzer.ts)
-- arbeitet. Auswertung unter /admin/pruefset.
--
-- Nur Admins lesen; geschrieben wird über den Service-Client der Admin-Aktionen.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.gold_answers (
  id               uuid primary key default gen_random_uuid(),
  -- Herkunft: 'measurement' (measurement_answers) oder 'legacy' (altes Schema)
  source           text not null check (source in ('measurement', 'legacy')),
  source_id        uuid not null,
  target_name      text not null,
  topic            text,
  model            text,
  query_type       text,
  prompt           text not null,
  response         text not null,
  -- Bewertung (null = noch nicht bewertet)
  label_mentioned  boolean,
  label_position   smallint check (label_position is null or label_position between 1 and 50),
  label_sentiment  text check (label_sentiment in ('positive', 'neutral', 'negative')),
  label_note       text,
  -- Unklare Antworten aussortieren statt raten
  excluded         boolean not null default false,
  labeled_by       uuid references auth.users(id) on delete set null,
  labeled_at       timestamptz,
  created_at       timestamptz not null default now(),
  unique (source, source_id)
);

create index gold_answers_open_idx on public.gold_answers (created_at) where labeled_at is null and not excluded;

alter table public.gold_answers enable row level security;

create policy "gold_answers: admin read" on public.gold_answers
  for select using (public.is_app_admin());
