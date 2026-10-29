-- ─────────────────────────────────────────────────────────────────────────────
-- Umschaltung Production (palwrewcimwqhotossrv) auf Halo v2 – Phase 8
--
-- Nichts wird gelöscht: Das alte public-Schema wandert vollständig in das
-- Archiv-Schema legacy_v1 (nicht über die API erreichbar). Danach entsteht das
-- neue Schema, und übernommen werden nur:
--   - Warteliste (waitlist_signups)
--   - Kalibrierungs-Verlauf (calibration_runs)
--   - Logins mit Admin-/Sperr-Status (auth.users + alte profiles → app_users)
-- Messungen, Profile, Themen usw. werden NICHT übernommen (Entscheidung „Neustart“).
-- Bestehende Logins bleiben gültig und landen beim nächsten Login im Assistenten.
--
-- Ablauf im Supabase SQL-Editor, jeweils als eigener Lauf:
--   1. Teil A dieses Skripts
--   2. supabase/migrations/20261029120000_halo_v2.sql
--   3. supabase/migrations/20261029130000_persons_owner_read.sql
--   4. Teil B dieses Skripts
-- Rückweg bis zum Löschen von legacy_v1: neues Schema entfernen
-- (supabase/manual/reset_public_schema.sql ohne Nutzer-Prüfung) und die
-- Objekte aus legacy_v1 per „set schema public“ zurückholen.
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══ Teil A: altes Schema archivieren ═══════════════════════════════════════

create schema if not exists legacy_v1;
revoke all on schema legacy_v1 from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

do $$
declare
  r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I set schema legacy_v1', r.tablename);
  end loop;
  for r in select viewname from pg_views where schemaname = 'public' loop
    execute format('alter view public.%I set schema legacy_v1', r.viewname);
  end loop;
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('alter function %s set schema legacy_v1', r.sig);
  end loop;
  for r in
    select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  loop
    execute format('alter type public.%I set schema legacy_v1', r.typname);
  end loop;
end $$;

-- Kontrolle: muss 0 Zeilen liefern
select 'table' as kind, tablename as name from pg_tables where schemaname = 'public'
union all
select 'type', t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typtype = 'e';


-- ═══ Teil B: Daten übernehmen (nach den beiden Migrationen) ═════════════════

-- Logins: der Trigger legt app_users nur für neue Nutzer an.
insert into public.app_users (id, email, is_admin, banned_at, created_at)
select u.id, u.email, coalesce(p.is_admin, false), p.banned_at, u.created_at
from auth.users u
left join legacy_v1.profiles p on p.id = u.id
on conflict (id) do nothing;

insert into public.waitlist_signups (id, email, source, created_at)
select id, email, source, created_at from legacy_v1.waitlist_signups
on conflict do nothing;

insert into public.calibration_runs (
  id, entry_key, kind, person_name, topic, language, score, mention_rate,
  rounds, queries_per_round, per_model, flag, flag_detail, measured_at
)
select
  id, entry_key, kind, person_name, topic, language, score, mention_rate,
  rounds, queries_per_round, per_model, flag, flag_detail, measured_at
from legacy_v1.calibration_runs
on conflict do nothing;

-- Kontrolle
select
  (select count(*) from auth.users)                       as logins,
  (select count(*) from public.app_users)                 as app_users,
  (select count(*) from public.app_users where is_admin)  as admins,
  (select count(*) from public.waitlist_signups)          as warteliste,
  (select count(*) from legacy_v1.waitlist_signups)       as warteliste_alt,
  (select count(*) from public.calibration_runs)          as kalibrierung,
  (select count(*) from legacy_v1.calibration_runs)       as kalibrierung_alt;
