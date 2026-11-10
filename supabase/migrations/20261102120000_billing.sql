-- ─────────────────────────────────────────────────────────────────────────────
-- Bezahlung mit Stripe (docs/stripe-plan.md).
--
-- Abo-Felder am Konto; geschrieben nur vom Stripe-Webhook (Service-Client).
-- Wie `plan` darf der Konto-Owner sie nicht selbst ändern.
-- stripe_events: jede Webhook-Zustellung nur einmal verarbeiten.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.accounts
  add column if not exists stripe_customer_id     text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status    text,
  add column if not exists billing_interval       text check (billing_interval in ('month', 'year')),
  add column if not exists seats                  integer check (seats is null or seats > 0),
  add column if not exists current_period_end     timestamptz,
  add column if not exists cancel_at_period_end   boolean not null default false;

create or replace function public.protect_account_plan()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin')
     and (new.plan                   is distinct from old.plan
       or new.stripe_customer_id     is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.subscription_status    is distinct from old.subscription_status
       or new.billing_interval       is distinct from old.billing_interval
       or new.seats                  is distinct from old.seats
       or new.current_period_end     is distinct from old.current_period_end
       or new.cancel_at_period_end   is distinct from old.cancel_at_period_end) then
    raise exception 'Der Tarif kann nur von Halo geändert werden.';
  end if;
  return new;
end;
$$;

-- Themen, die beim Ende eines Abos über der Tarifgrenze lagen. Beim nächsten
-- Upgrade werden genau diese wieder aktiv (vom Nutzer pausierte bleiben aus).
alter table public.topics
  add column if not exists paused_by_plan boolean not null default false;

create table if not exists public.stripe_events (
  id          text primary key,
  type        text not null,
  account_id  uuid references public.accounts(id) on delete set null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

drop policy if exists "stripe_events: admin read" on public.stripe_events;
create policy "stripe_events: admin read" on public.stripe_events
  for select using (exists (select 1 from public.app_users u where u.id = auth.uid() and u.is_admin));
