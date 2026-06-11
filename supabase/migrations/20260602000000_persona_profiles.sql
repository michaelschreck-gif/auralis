-- AI Persona Profile: wie KI-Modelle eine Person beschreiben (gewichtete Rollen).
-- Aus den gespeicherten query_results-Antworten des jüngsten Reports destilliert.

create table if not exists public.persona_profiles (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  report_id     uuid references public.visibility_reports(id) on delete set null,
  roles         jsonb not null default '[]'::jsonb,  -- [{ label, weight }]
  summary       text,
  model         text,
  generated_at  timestamptz not null default now()
);

alter table public.persona_profiles enable row level security;

drop policy if exists "Owner can manage own persona_profiles" on public.persona_profiles;
create policy "Owner can manage own persona_profiles"
  on public.persona_profiles
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create index if not exists persona_profiles_profile_created_idx
  on public.persona_profiles (profile_id, generated_at desc);
