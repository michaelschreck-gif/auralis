-- ─────────────────────────────────────────────────────────────────────────────
-- Wochenbrief per Mail: jeden Montag Halo Score, Veränderungen seit dem
-- letzten Brief und die nächste Maßnahme (lib/halo/brief.ts).
--
-- app_users.weekly_brief  An/Aus je Login (Konto-Seite oder Abmeldelink).
-- brief_sends             Ein Eintrag je Login und Woche; die Eindeutigkeit
--                         verhindert doppelte Mails, wenn der Cron zweimal läuft.
-- Geschrieben wird nur über den Service-Client.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.app_users add column if not exists weekly_brief boolean not null default true;

create table public.brief_sends (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  -- ISO-Woche, z. B. '2026-W45'
  week       text not null,
  status     text not null default 'sending' check (status in ('sending', 'sent', 'skipped', 'failed')),
  error      text,
  payload    jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, week)
);

create index brief_sends_user_idx on public.brief_sends (user_id, created_at desc);

alter table public.brief_sends enable row level security;

create policy "brief_sends: self read" on public.brief_sends
  for select using (user_id = auth.uid() or public.is_app_admin());
