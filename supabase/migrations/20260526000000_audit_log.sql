-- ─────────────────────────────────────────────────────────────────────────────
-- Audit Log – immutable record of admin actions
--
-- Written by the admin panel (admin-auralis) using the service-role client.
-- Read by admins only via the audit dashboard.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action      text        NOT NULL,
  target_type text,
  target_id   uuid,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX idx_audit_log_actor      ON public.audit_log (actor_id);
CREATE INDEX idx_audit_log_action     ON public.audit_log (action);
CREATE INDEX idx_audit_log_target     ON public.audit_log (target_type, target_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit entries.
CREATE POLICY "audit_log: admin read"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- No INSERT/UPDATE/DELETE policies – only the service_role can write,
-- which bypasses RLS by design. This keeps the audit trail immutable
-- from the perspective of any authenticated client.
