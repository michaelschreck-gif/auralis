-- Owner darf eine gerade angelegte Person sofort zurücklesen (INSERT … RETURNING).
--
-- can_access_person(id) sucht die Person in persons; die im selben Statement
-- eingefügte Zeile ist für die Funktion noch nicht sichtbar → RETURNING wurde
-- abgelehnt und damit das ganze INSERT („Person konnte nicht angelegt werden“).
-- is_account_owner(account_id) nutzt die Spalte der Zeile selbst.

drop policy if exists "persons: read" on public.persons;
create policy "persons: read" on public.persons
  for select using (public.is_account_owner(account_id) or public.can_access_person(id));

drop policy if exists "persons: update" on public.persons;
create policy "persons: update" on public.persons
  for update
  using (public.is_account_owner(account_id) or public.can_access_person(id))
  with check (public.is_account_owner(account_id) or public.can_access_person(id));
