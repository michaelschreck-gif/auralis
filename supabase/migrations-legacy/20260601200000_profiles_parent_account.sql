-- Sub-Accounts: verwaltete Profile, die zu einem Eltern-Account gehören.
-- parent_account_id zeigt auf das Profil des Eltern-Accounts (Enterprise).
-- Wird der Eltern-Account gelöscht, bleibt der Sub-Account bestehen (set null).

alter table public.profiles
  add column if not exists parent_account_id uuid references public.profiles(id) on delete set null;

create index if not exists profiles_parent_account_idx
  on public.profiles (parent_account_id);
