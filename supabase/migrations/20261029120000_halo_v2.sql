-- ─────────────────────────────────────────────────────────────────────────────
-- Halo v2 – Neuaufbau (docs/neuaufbau-plan.md)
--
-- Konto (wer zahlt/verwaltet) und Person (wer gemessen wird) sind getrennt.
--   accounts         Einzelperson- oder Team-Konto
--   account_members  Logins: owner sieht alle Personen des Kontos,
--                    member nur die eigene Person (account_members.person_id)
--   persons          gemessene Personen, alles Weitere hängt an person_id
--
-- Zugriff läuft überall über can_access_person(person_id).
-- Setzt ein leeres public-Schema voraus (Neustart, keine Datenübernahme).
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.account_type   as enum ('individual', 'team');
create type public.member_role    as enum ('owner', 'member');
create type public.plan_type      as enum ('free', 'starter', 'pro', 'enterprise');
-- IDs wie in lib/auralis/markets.ts
create type public.market_id      as enum ('dach', 'us', 'uk', 'eu', 'ca', 'au', 'global');
create type public.frequency_type as enum ('daily', 'weekly', 'monthly');
create type public.trigger_type   as enum ('scheduled', 'manual');
create type public.sentiment_type as enum ('positive', 'neutral', 'negative');
create type public.job_status     as enum ('queued', 'running', 'done', 'failed');
create type public.action_status  as enum ('open', 'done', 'dismissed');

-- ─── Nutzer ─────────────────────────────────────────────────────────────────

-- Eine Zeile je Login (angelegt per Trigger). Nur Admin-Flags, keine Messdaten.
create table public.app_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  is_admin    boolean not null default false,
  banned_at   timestamptz,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Konto, Personen, Mitglieder ────────────────────────────────────────────

create table public.accounts (
  id             uuid primary key default gen_random_uuid(),
  type           public.account_type not null,
  name           text not null,
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  -- Preismodell folgt später; bis dahin ungenutzt.
  plan           public.plan_type not null default 'free',
  created_at     timestamptz not null default now()
);
create index accounts_owner_idx on public.accounts (owner_user_id);

create table public.persons (
  id                     uuid primary key default gen_random_uuid(),
  account_id             uuid not null references public.accounts(id) on delete cascade,
  first_name             text not null,
  last_name              text not null,
  -- Rolle/Unternehmen zur Abgrenzung von Namensvettern.
  context                text,
  market                 public.market_id not null default 'dach',
  website_url            text,
  public_slug            text,
  public_profile_enabled boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index persons_account_idx on public.persons (account_id);
create unique index persons_public_slug_idx on public.persons (public_slug) where public_slug is not null;

create table public.account_members (
  account_id  uuid not null references public.accounts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.member_role not null,
  -- Nur bei role = member: die Person, die dieser Login sehen darf.
  person_id   uuid references public.persons(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (account_id, user_id),
  constraint member_has_person check (role = 'owner' or person_id is not null)
);
create index account_members_user_idx on public.account_members (user_id);
create index account_members_person_idx on public.account_members (person_id);

-- ─── Zugriffsfunktionen (security definer → keine RLS-Rekursion) ────────────

create or replace function public.is_account_owner(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.account_members
    where account_id = p_account_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.is_account_member(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.account_members
    where account_id = p_account_id and user_id = auth.uid()
  );
$$;

-- Owner: alle Personen des Kontos. Member: nur die eigene Person.
create or replace function public.can_access_person(p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.persons p
    join public.account_members m on m.account_id = p.account_id
    where p.id = p_person_id
      and m.user_id = auth.uid()
      and (m.role = 'owner' or m.person_id = p.id)
  );
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_users where id = auth.uid() and is_admin);
$$;

-- Konto + Owner-Mitgliedschaft in einem Schritt (vom Assistenten aufgerufen).
create or replace function public.create_account(p_type public.account_type, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.accounts (type, name, owner_user_id)
  values (p_type, p_name, auth.uid())
  returning id into v_account_id;
  insert into public.account_members (account_id, user_id, role)
  values (v_account_id, auth.uid(), 'owner');
  return v_account_id;
end;
$$;

-- ─── Themen und Messungen ───────────────────────────────────────────────────

create table public.topics (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.persons(id) on delete cascade,
  name         text not null,
  is_active    boolean not null default true,
  frequency    public.frequency_type not null default 'weekly',
  next_run_at  timestamptz not null default now(),
  last_run_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index topics_person_idx on public.topics (person_id);
create index topics_due_idx on public.topics (next_run_at) where is_active;

-- Eine Messung je Thema; der Halo Score wird aus den jüngsten Messungen berechnet.
create table public.measurements (
  id                uuid primary key default gen_random_uuid(),
  person_id         uuid not null references public.persons(id) on delete cascade,
  topic_id          uuid references public.topics(id) on delete set null,
  trigger           public.trigger_type not null,
  ai_score          numeric,
  perception_score  numeric,
  sentiment         public.sentiment_type,
  models_ok         smallint not null default 0,
  models_total      smallint not null default 0,
  stability         jsonb,
  summary           text,
  raw               jsonb,
  created_at        timestamptz not null default now()
);
create index measurements_person_idx on public.measurements (person_id, created_at desc);
create index measurements_topic_idx on public.measurements (topic_id, created_at desc);

create table public.measurement_answers (
  id              uuid primary key default gen_random_uuid(),
  measurement_id  uuid not null references public.measurements(id) on delete cascade,
  person_id       uuid not null references public.persons(id) on delete cascade,
  model           text not null,
  query_type      text,
  prompt          text not null,
  response        text,
  mentioned       boolean not null default false,
  position        smallint,
  sentiment       public.sentiment_type,
  latency_ms      integer,
  tokens_used     integer,
  created_at      timestamptz not null default now()
);
create index measurement_answers_measurement_idx on public.measurement_answers (measurement_id);
create index measurement_answers_person_idx on public.measurement_answers (person_id, created_at desc);

create table public.google_measurements (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.persons(id) on delete cascade,
  source      text not null,
  score       numeric,
  signals     jsonb,
  raw         jsonb,
  created_at  timestamptz not null default now()
);
create index google_measurements_person_idx on public.google_measurements (person_id, created_at desc);

create table public.jobs (
  id                uuid primary key default gen_random_uuid(),
  person_id         uuid not null references public.persons(id) on delete cascade,
  topic_id          uuid not null references public.topics(id) on delete cascade,
  trigger           public.trigger_type not null,
  advance_next_run  boolean not null default false,
  status            public.job_status not null default 'queued',
  measurement_id    uuid references public.measurements(id) on delete set null,
  error             text,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  finished_at       timestamptz
);
create index jobs_topic_idx on public.jobs (topic_id, created_at desc);
create index jobs_person_idx on public.jobs (person_id, created_at desc);

-- ─── Wettbewerber, Maßnahmen, Persona ───────────────────────────────────────

create table public.competitors (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.persons(id) on delete cascade,
  name        text not null,
  topics      text[] not null default '{}',
  market      public.market_id not null default 'global',
  created_at  timestamptz not null default now()
);
create index competitors_person_idx on public.competitors (person_id);

create table public.competitor_measurements (
  id             uuid primary key default gen_random_uuid(),
  competitor_id  uuid not null references public.competitors(id) on delete cascade,
  person_id      uuid not null references public.persons(id) on delete cascade,
  ai_score       numeric,
  raw            jsonb,
  created_at     timestamptz not null default now()
);
create index competitor_measurements_competitor_idx on public.competitor_measurements (competitor_id, created_at desc);

create table public.actions (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid not null references public.persons(id) on delete cascade,
  measurement_id  uuid references public.measurements(id) on delete set null,
  title           text not null,
  detail          text,
  category        text,
  impact          text,
  status          public.action_status not null default 'open',
  score_before    numeric,
  score_after     numeric,
  created_at      timestamptz not null default now(),
  done_at         timestamptz
);
create index actions_person_idx on public.actions (person_id, status);

create table public.persona_snapshots (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid not null references public.persons(id) on delete cascade,
  measurement_id  uuid references public.measurements(id) on delete set null,
  roles           jsonb not null default '[]'::jsonb,
  summary         text,
  model           text,
  created_at      timestamptz not null default now()
);
create index persona_snapshots_person_idx on public.persona_snapshots (person_id, created_at desc);

-- ─── API ────────────────────────────────────────────────────────────────────

create table public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.accounts(id) on delete cascade,
  name          text not null,
  key_hash      text not null,
  key_prefix    text not null,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);
create unique index api_keys_hash_idx on public.api_keys (key_hash);
create index api_keys_account_idx on public.api_keys (account_id);

create table public.api_usage (
  account_id  uuid not null references public.accounts(id) on delete cascade,
  day         date not null default current_date,
  count       integer not null default 0,
  primary key (account_id, day)
);

create or replace function public.increment_api_usage(p_account_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.api_usage (account_id, day, count)
  values (p_account_id, current_date, 1)
  on conflict (account_id, day)
  do update set count = public.api_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

-- ─── Betrieb (nur service_role schreibt, Admins lesen) ──────────────────────

create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users(id) on delete set null,
  actor_email  text,
  action       text not null,
  target_type  text,
  target_id    uuid,
  payload      jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

create table public.calibration_runs (
  id                 uuid primary key default gen_random_uuid(),
  entry_key          text not null,
  kind               text not null check (kind in ('positive', 'negative')),
  person_name        text not null,
  topic              text not null,
  language           text not null,
  score              integer not null,
  mention_rate       integer not null,
  rounds             integer not null,
  queries_per_round  integer not null,
  per_model          jsonb not null default '[]'::jsonb,
  flag               text,
  flag_detail        text,
  measured_at        timestamptz not null default now()
);
create index calibration_runs_entry_idx on public.calibration_runs (entry_key, measured_at desc);

create table public.waitlist_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,
  created_at  timestamptz not null default now()
);
create unique index waitlist_signups_email_idx on public.waitlist_signups (lower(email));

-- Fällige Themen für den Cron (service_role).
create or replace function public.get_due_topics()
returns setof public.topics
language sql
stable
security definer
set search_path = public
as $$
  select * from public.topics where is_active and next_run_at <= now();
$$;

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.app_users               enable row level security;
alter table public.accounts                enable row level security;
alter table public.account_members         enable row level security;
alter table public.persons                 enable row level security;
alter table public.topics                  enable row level security;
alter table public.measurements            enable row level security;
alter table public.measurement_answers     enable row level security;
alter table public.google_measurements     enable row level security;
alter table public.jobs                    enable row level security;
alter table public.competitors             enable row level security;
alter table public.competitor_measurements enable row level security;
alter table public.actions                 enable row level security;
alter table public.persona_snapshots       enable row level security;
alter table public.api_keys                enable row level security;
alter table public.api_usage               enable row level security;
alter table public.audit_log               enable row level security;
alter table public.calibration_runs        enable row level security;
alter table public.waitlist_signups        enable row level security;

create policy "app_users: self read" on public.app_users
  for select using (id = auth.uid());

-- Konto: Mitglieder lesen, Owner ändert/löscht. Anlegen nur über create_account().
create policy "accounts: member read" on public.accounts
  for select using (public.is_account_member(id));
create policy "accounts: owner update" on public.accounts
  for update using (public.is_account_owner(id)) with check (public.is_account_owner(id));
create policy "accounts: owner delete" on public.accounts
  for delete using (public.is_account_owner(id));

-- Mitgliedschaften: eigene Zeile lesen; Owner liest und verwaltet alle.
create policy "account_members: read" on public.account_members
  for select using (user_id = auth.uid() or public.is_account_owner(account_id));
create policy "account_members: owner insert" on public.account_members
  for insert with check (public.is_account_owner(account_id));
create policy "account_members: owner update" on public.account_members
  for update using (public.is_account_owner(account_id)) with check (public.is_account_owner(account_id));
create policy "account_members: owner delete" on public.account_members
  for delete using (public.is_account_owner(account_id) and user_id <> auth.uid());

-- Personen: lesen/ändern wer Zugriff hat, anlegen/löschen nur der Owner.
create policy "persons: read" on public.persons
  for select using (public.can_access_person(id));
create policy "persons: owner insert" on public.persons
  for insert with check (public.is_account_owner(account_id));
create policy "persons: update" on public.persons
  for update using (public.can_access_person(id)) with check (public.can_access_person(id));
create policy "persons: owner delete" on public.persons
  for delete using (public.is_account_owner(account_id));

-- Alles an einer Person: eine Regel.
create policy "topics: person access" on public.topics
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy "measurements: person access" on public.measurements
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy "measurement_answers: person access" on public.measurement_answers
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy "google_measurements: person access" on public.google_measurements
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy "jobs: person access" on public.jobs
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy "competitors: person access" on public.competitors
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy "competitor_measurements: person access" on public.competitor_measurements
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy "actions: person access" on public.actions
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy "persona_snapshots: person access" on public.persona_snapshots
  for all using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));

-- API-Schlüssel und -Nutzung: Konto-Owner.
create policy "api_keys: owner" on public.api_keys
  for all using (public.is_account_owner(account_id)) with check (public.is_account_owner(account_id));
create policy "api_usage: owner read" on public.api_usage
  for select using (public.is_account_owner(account_id));

-- Betriebsdaten: nur Admins lesen; geschrieben wird per service_role.
create policy "audit_log: admin read" on public.audit_log
  for select using (public.is_app_admin());
create policy "calibration_runs: admin read" on public.calibration_runs
  for select using (public.is_app_admin());
create policy "waitlist_signups: admin read" on public.waitlist_signups
  for select using (public.is_app_admin());

-- Öffentliche Profile: anonym lesbar, wenn freigegeben.
create policy "persons: public profile" on public.persons
  for select to anon using (public_profile_enabled and public_slug is not null);
