-- Recommendation Probability (Sprint: MVP-Trio #3)
-- Speichert pro Lauf, wie wahrscheinlich die Person empfohlen wird, wenn KI
-- nach einem Speaker/Berater/Trainer/Podcast-Gast für ihre Themen gefragt wird.

create table if not exists public.recommendation_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  overall_probability numeric,
  roles jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default now()
);

alter table public.recommendation_reports enable row level security;

create policy "recommendation_reports owner all"
  on public.recommendation_reports
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create index if not exists recommendation_reports_profile_created_idx
  on public.recommendation_reports (profile_id, created_at desc);
