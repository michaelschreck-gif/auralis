-- ─────────────────────────────────────────────────────────────────────────────
-- Zugriffstests für halo_v2 (RLS). Im SQL-Editor als postgres ausführen.
-- Läuft in einer Transaktion und rollt alles zurück.
-- Bestanden: „Success. No rows returned“. Fehlgeschlagen: Fehler mit Text „FEHLER: …“.
--
-- Aufbau:
--   Team-Konto T  (Owner O)       Personen A, B; Mitglied M sieht nur A
--   Einzelkonto I (Owner X)       Person C
-- ─────────────────────────────────────────────────────────────────────────────

begin;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.local',    'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'member@test.local',   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'outsider@test.local', 'authenticated', 'authenticated');

insert into public.accounts (id, type, name, owner_user_id) values
  ('00000000-0000-0000-0000-0000000000b1', 'team',       'Team T', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b2', 'individual', 'Solo I', '00000000-0000-0000-0000-0000000000a3');

insert into public.persons (id, account_id, first_name, last_name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'Anna',  'A'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1', 'Bernd', 'B'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b2', 'Clara', 'C');

insert into public.account_members (account_id, user_id, role, person_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'owner',  null),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2', 'member', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a3', 'owner',  null);

insert into public.topics (person_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', 'Thema A'),
  ('00000000-0000-0000-0000-0000000000c2', 'Thema B'),
  ('00000000-0000-0000-0000-0000000000c3', 'Thema C');

insert into public.measurements (person_id, trigger, ai_score) values
  ('00000000-0000-0000-0000-0000000000c1', 'manual', 10),
  ('00000000-0000-0000-0000-0000000000c2', 'manual', 20),
  ('00000000-0000-0000-0000-0000000000c3', 'manual', 30);

do $$ begin
  if (select count(*) from public.app_users where email like '%@test.local') <> 3 then
    raise exception 'FEHLER: Trigger hat app_users nicht angelegt';
  end if;
end $$;

-- ─── Owner O ────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

do $$
declare n int;
begin
  if (select count(*) from public.persons) <> 2 then raise exception 'FEHLER: Owner sieht nicht genau seine 2 Personen'; end if;
  if (select count(*) from public.topics) <> 2 then raise exception 'FEHLER: Owner sieht nicht genau 2 Themen'; end if;
  if (select count(*) from public.measurements) <> 2 then raise exception 'FEHLER: Owner sieht nicht genau 2 Messungen'; end if;
  if (select count(*) from public.account_members) <> 2 then raise exception 'FEHLER: Owner sieht nicht alle Mitglieder seines Kontos'; end if;
  if (select count(*) from public.accounts) <> 1 then raise exception 'FEHLER: Owner sieht fremde Konten'; end if;

  -- Wie die App: anlegen und die ID sofort zurücklesen (RETURNING braucht die Leseregel).
  declare new_id uuid;
  begin
    insert into public.persons (account_id, first_name, last_name)
    values ('00000000-0000-0000-0000-0000000000b1', 'Neu', 'Person')
    returning id into new_id;
    if new_id is null then raise exception 'FEHLER: Owner bekommt die neue Person nicht zurück'; end if;
    insert into public.topics (person_id, name) values (new_id, 'Neues Thema');
  end;

  begin
    insert into public.persons (account_id, first_name, last_name)
    values ('00000000-0000-0000-0000-0000000000b2', 'Fremd', 'Person');
    raise exception 'FEHLER: Owner konnte Person in fremdem Konto anlegen';
  exception when insufficient_privilege then null;
  end;

  update public.persons set context = 'geändert' where id = '00000000-0000-0000-0000-0000000000c3';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FEHLER: Owner konnte fremde Person ändern'; end if;

  if public.create_account('individual', 'Zweites Konto') is null then
    raise exception 'FEHLER: create_account liefert keine ID';
  end if;
  if (select count(*) from public.accounts) <> 2 then raise exception 'FEHLER: neues Konto nicht sichtbar'; end if;
end $$;

-- ─── Mitglied M (nur Person A) ──────────────────────────────────────────────
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);

do $$
declare n int;
begin
  if (select count(*) from public.persons) <> 1 then raise exception 'FEHLER: Mitglied sieht mehr als seine Person'; end if;
  if (select first_name from public.persons) <> 'Anna' then raise exception 'FEHLER: Mitglied sieht falsche Person'; end if;
  if (select count(*) from public.topics) <> 1 then raise exception 'FEHLER: Mitglied sieht fremde Themen'; end if;
  if (select count(*) from public.measurements) <> 1 then raise exception 'FEHLER: Mitglied sieht fremde Messungen'; end if;
  if (select count(*) from public.account_members) <> 1 then raise exception 'FEHLER: Mitglied sieht andere Mitgliedschaften'; end if;
  if (select count(*) from public.accounts) <> 1 then raise exception 'FEHLER: Mitglied sieht sein Konto nicht'; end if;

  update public.persons set context = 'eigene Rolle' where id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FEHLER: Mitglied kann eigene Person nicht ändern'; end if;

  update public.persons set context = 'fremd' where id = '00000000-0000-0000-0000-0000000000c2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FEHLER: Mitglied konnte Person B ändern'; end if;

  insert into public.topics (person_id, name) values ('00000000-0000-0000-0000-0000000000c1', 'Eigenes Thema');

  begin
    insert into public.topics (person_id, name) values ('00000000-0000-0000-0000-0000000000c2', 'Fremdes Thema');
    raise exception 'FEHLER: Mitglied konnte Thema für Person B anlegen';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.persons (account_id, first_name, last_name)
    values ('00000000-0000-0000-0000-0000000000b1', 'Mitglied', 'Neu');
    raise exception 'FEHLER: Mitglied konnte Person anlegen';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.account_members (account_id, user_id, role)
    values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a3', 'owner');
    raise exception 'FEHLER: Mitglied konnte sich/andere zum Owner machen';
  exception when insufficient_privilege then null;
  end;

  update public.account_members set role = 'owner'
  where user_id = '00000000-0000-0000-0000-0000000000a2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FEHLER: Mitglied konnte eigene Rolle ändern'; end if;
end $$;

-- ─── Fremder X (eigenes Einzelkonto) ────────────────────────────────────────
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);

do $$ begin
  if (select count(*) from public.persons) <> 1 then raise exception 'FEHLER: Fremder sieht Personen aus Team T'; end if;
  if (select count(*) from public.measurements) <> 1 then raise exception 'FEHLER: Fremder sieht Messungen aus Team T'; end if;
  if (select count(*) from public.account_members) <> 1 then raise exception 'FEHLER: Fremder sieht fremde Mitgliedschaften'; end if;
end $$;

-- ─── Anonym ─────────────────────────────────────────────────────────────────
reset role;
update public.persons set public_slug = 'clara-c', public_profile_enabled = true
where id = '00000000-0000-0000-0000-0000000000c3';
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$ begin
  if (select count(*) from public.persons) <> 1 then raise exception 'FEHLER: anonym nicht genau das freigegebene Profil sichtbar'; end if;
  if (select count(*) from public.measurements) <> 0 then raise exception 'FEHLER: anonym sieht Messungen'; end if;
  if (select count(*) from public.accounts) <> 0 then raise exception 'FEHLER: anonym sieht Konten'; end if;
end $$;

reset role;
rollback;
