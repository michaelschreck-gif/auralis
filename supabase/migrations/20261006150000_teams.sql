-- Teams (Organisationseinheiten für die Admin-Verwaltung):
-- ein Team hat einen Namen und beliebig viele Mitglieder; eine Person kann
-- in mehreren Teams sein. Unabhängig von profiles.parent_account_id
-- (verwaltete Sub-Accounts des Enterprise-Ablaufs).

create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id     uuid not null references public.teams(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (team_id, profile_id)
);

create index if not exists team_members_profile_idx on public.team_members (profile_id);

-- Nur der Service-Role-Client (Admin-App) liest/schreibt; keine Policies.
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Bestehende Enterprise-Teams (Inhaber + Sub-Accounts) übernehmen.
insert into public.teams (id, name)
select p.id, coalesce(nullif(p.team_name, ''), nullif(p.full_name, ''), p.email)
from public.profiles p
where exists (select 1 from public.profiles c where c.parent_account_id = p.id)
on conflict (id) do nothing;

insert into public.team_members (team_id, profile_id)
select p.id, p.id
from public.profiles p
where exists (select 1 from public.profiles c where c.parent_account_id = p.id)
on conflict do nothing;

insert into public.team_members (team_id, profile_id)
select c.parent_account_id, c.id
from public.profiles c
where c.parent_account_id is not null
on conflict do nothing;
