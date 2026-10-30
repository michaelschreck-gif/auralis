-- Tages-Zähler für API-Abfragen (Rate-Limiting der Public-API).
-- Pro Profil und Tag genau eine Zeile; atomar hochgezählt via increment_api_usage().

create table if not exists public.api_usage (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  day         date not null default current_date,
  count       integer not null default 0,
  primary key (profile_id, day)
);

alter table public.api_usage enable row level security;

-- Owner darf eigene Nutzung lesen (Schreibzugriff nur über SECURITY-DEFINER-Function).
drop policy if exists "Owner can read own api_usage" on public.api_usage;
create policy "Owner can read own api_usage"
  on public.api_usage
  for select
  using (auth.uid() = profile_id);

-- Atomar hochzählen und neuen Tageswert zurückgeben.
create or replace function public.increment_api_usage(p_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.api_usage (profile_id, day, count)
  values (p_profile_id, current_date, 1)
  on conflict (profile_id, day)
  do update set count = public.api_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;
