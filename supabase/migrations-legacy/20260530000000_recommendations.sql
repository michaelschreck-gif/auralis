-- Sprint 18: persistierte Empfehlungen mit Wirkungs-Loop
-- Empfehlungen werden einmal generiert, gespeichert und koennen als erledigt
-- markiert werden. score_at_creation / score_at_done erlauben die Messung des
-- Effekts (Score-Delta seit Umsetzung).

create table if not exists public.recommendations (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  report_id         uuid references public.visibility_reports(id) on delete set null,
  title             text not null,
  description       text not null,
  impact            text not null default 'medium',  -- high | medium | low
  category          text not null default 'Inhalt',
  status            text not null default 'open',     -- open | done | dismissed
  score_at_creation numeric,                          -- Aura/Overall-Score bei Generierung
  score_at_done     numeric,                          -- Score bei "erledigt"
  created_at        timestamptz not null default now(),
  done_at           timestamptz
);

alter table public.recommendations enable row level security;

drop policy if exists "Owner can manage own recommendations" on public.recommendations;
create policy "Owner can manage own recommendations"
  on public.recommendations
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create index if not exists recommendations_profile_status_idx
  on public.recommendations (profile_id, status, created_at desc);
