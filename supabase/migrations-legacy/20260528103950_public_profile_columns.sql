ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS public_profile_enabled boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_slug ON public.profiles(public_slug) WHERE public_slug IS NOT NULL;
CREATE POLICY "Public profiles by slug" ON public.profiles FOR SELECT USING (public_profile_enabled = true);
