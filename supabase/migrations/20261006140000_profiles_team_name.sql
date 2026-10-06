-- Teamname für Team-Inhaber (Enterprise). Getrennt vom Personennamen,
-- damit ein Team unabhängig vom Namen des Inhabers benannt werden kann.
alter table public.profiles
  add column if not exists team_name text;
