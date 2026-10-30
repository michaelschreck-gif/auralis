-- ─────────────────────────────────────────────────────────────────────────────
-- Altes public-Schema (Auralis v1) vollständig entfernen, vor halo_v2.
--
-- NUR für Staging gedacht und für die spätere Umschaltung von Production
-- (dann nur nach ausdrücklicher Freigabe). Löscht alle Daten unwiderruflich.
-- Bricht ab, sobald noch Nutzer existieren – auf Production vorher gezielt
-- die Prüfung anpassen.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  if (select count(*) from auth.users) > 0 then
    raise exception 'auth.users ist nicht leer – Abbruch (bewusste Sicherung)';
  end if;
end $$;

drop trigger if exists on_auth_user_created on auth.users;

do $$
declare
  r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('drop function if exists %s cascade', r.sig);
  end loop;
  for r in
    select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
end $$;
