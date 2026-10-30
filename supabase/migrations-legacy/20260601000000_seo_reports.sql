-- SEO-Sichtbarkeit (off-site SERP + on-site Search Console).
-- Parallel zu visibility_reports, nutzt dieselben monitoring_schedules-Themen.
-- source: 'serp' (Google-Ranking via SERP-API), 'gsc' (eigene Domain via Search
-- Console) oder 'combined' (aggregiert). seo_score = 0-100, raw_data = Signal-Block.

create table if not exists public.seo_reports (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  schedule_id     uuid references public.monitoring_schedules(id) on delete set null,
  source          text not null default 'serp',   -- serp | gsc | combined
  trigger         text not null default 'manual',  -- scheduled | manual | webhook
  seo_score       numeric,                         -- 0-100, null wenn nicht messbar
  raw_data        jsonb,                           -- Signal-Block + perTopic
  created_at      timestamptz not null default now()
);

alter table public.seo_reports enable row level security;

drop policy if exists "Owner can manage own seo_reports" on public.seo_reports;
create policy "Owner can manage own seo_reports"
  on public.seo_reports
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create index if not exists seo_reports_profile_created_idx
  on public.seo_reports (profile_id, created_at desc);
create index if not exists seo_reports_schedule_idx
  on public.seo_reports (schedule_id);

-- Eigene Website für on-site SEO (Search Console) + spätere Anzeige.
alter table public.profiles add column if not exists website_url text;
