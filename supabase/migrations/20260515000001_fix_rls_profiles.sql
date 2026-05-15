-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: add INSERT policy for profiles (column is `id`, not `user_id`)
-- The original schema had SELECT + UPDATE but no INSERT policy.
-- Upsert from the browser client fails without it.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop all existing profile policies and rebuild cleanly
DROP POLICY IF EXISTS "profiles: owner read"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: owner update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: select own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: delete own"   ON public.profiles;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: delete own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- monitoring_schedules already has FOR ALL — verify and keep consistent
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "schedules: owner all"    ON public.monitoring_schedules;
DROP POLICY IF EXISTS "schedules: select own"   ON public.monitoring_schedules;
DROP POLICY IF EXISTS "schedules: insert own"   ON public.monitoring_schedules;
DROP POLICY IF EXISTS "schedules: update own"   ON public.monitoring_schedules;
DROP POLICY IF EXISTS "schedules: delete own"   ON public.monitoring_schedules;

CREATE POLICY "schedules: select own"
  ON public.monitoring_schedules FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "schedules: insert own"
  ON public.monitoring_schedules FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "schedules: update own"
  ON public.monitoring_schedules FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "schedules: delete own"
  ON public.monitoring_schedules FOR DELETE
  USING (auth.uid() = profile_id);
