CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_api_keys_profile_id ON public.api_keys(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners select api keys" ON public.api_keys FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Owners insert api keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Owners update api keys" ON public.api_keys FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Owners delete api keys" ON public.api_keys FOR DELETE USING (auth.uid() = profile_id);
