-- ─────────────────────────────────────────────────────────────────────────────
-- Tarife werden wirksam: plan 'free' ist der kostenlose Check (Grenzen in
-- lib/halo/config.ts, PLAN_LIMITS). Neue Selbst-Registrierungen starten dort.
--
-- 1. Den Tarif darf nur Halo ändern (Admin über den Service-Client oder SQL),
--    nicht der Konto-Owner selbst – die Policy „accounts: owner update“
--    erlaubt sonst jede Spalte.
-- 2. Bestehende Konten bleiben unbegrenzt (enterprise).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.protect_account_plan()
returns trigger
language plpgsql
as $$
begin
  if new.plan is distinct from old.plan
     and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Der Tarif kann nur von Halo geändert werden.';
  end if;
  return new;
end;
$$;

drop trigger if exists accounts_protect_plan on public.accounts;
create trigger accounts_protect_plan
  before update on public.accounts
  for each row execute function public.protect_account_plan();

update public.accounts set plan = 'enterprise' where plan = 'free';
