-- ─────────────────────────────────────────────────────────────────────────────
-- Anfragen für Agentur-Leistungen (lib/halo/services.ts), gestellt im Tool
-- unter /p/[id]/leistungen. Score und Säulen werden zum Zeitpunkt der Anfrage
-- mitgespeichert (snapshot), damit das Angebot dazu passt.
-- Lesen/Bearbeiten im Admin läuft über den Service-Client.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.service_requests (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  person_id   uuid references public.persons(id) on delete set null,
  user_id     uuid references auth.users(id) on delete set null,
  services    text[] not null check (cardinality(services) > 0),
  message     text check (message is null or char_length(message) <= 2000),
  phone       text check (phone is null or char_length(phone) <= 40),
  snapshot    jsonb,
  status      text not null default 'new' check (status in ('new', 'contacted', 'offer', 'won', 'lost')),
  created_at  timestamptz not null default now()
);

create index if not exists service_requests_created_idx on public.service_requests (created_at desc);
create index if not exists service_requests_account_idx on public.service_requests (account_id, created_at desc);

alter table public.service_requests enable row level security;

-- Anlegen: nur für eine Person, auf die man Zugriff hat, im Konto dieser Person, als man selbst.
drop policy if exists "service_requests: person insert" on public.service_requests;
create policy "service_requests: person insert" on public.service_requests
  for insert with check (
    user_id = auth.uid()
    and person_id is not null
    and public.can_access_person(person_id)
    and account_id = (select p.account_id from public.persons p where p.id = person_id)
  );

-- Lesen: eigene Anfragen; Admins alles.
drop policy if exists "service_requests: own read" on public.service_requests;
create policy "service_requests: own read" on public.service_requests
  for select using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists "service_requests: admin update" on public.service_requests;
create policy "service_requests: admin update" on public.service_requests
  for update using (public.is_app_admin());
