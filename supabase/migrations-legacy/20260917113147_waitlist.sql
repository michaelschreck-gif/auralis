-- ─────────────────────────────────────────────────────────────────────────────
-- Waitlist Signups – public landing-page waitlist capture
--
-- Direct self-service signup is disabled on the public site for now; visitors
-- can only join the waitlist. Written by the public /api/waitlist route using
-- the service-role client (no anon INSERT policy — inserts must go through
-- that route, which validates/normalizes the email server-side).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.waitlist_signups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  source      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_waitlist_signups_email ON public.waitlist_signups (lower(email));
CREATE INDEX idx_waitlist_signups_created_at ON public.waitlist_signups (created_at DESC);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Admins can read the waitlist.
CREATE POLICY "waitlist_signups: admin read"
  ON public.waitlist_signups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- No INSERT/UPDATE/DELETE policies for anon/authenticated – only the
-- service_role (used by /api/waitlist) can write, bypassing RLS by design.
