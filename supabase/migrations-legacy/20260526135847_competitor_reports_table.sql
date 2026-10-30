CREATE TABLE IF NOT EXISTS public.competitor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trigger public.trigger_type NOT NULL DEFAULT 'manual',
  visibility_score numeric,
  sentiment public.sentiment_type,
  summary text,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_competitor_reports_competitor_id ON public.competitor_reports(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_reports_profile_id ON public.competitor_reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_competitor_reports_created_at ON public.competitor_reports(created_at DESC);
ALTER TABLE public.competitor_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners select competitor reports" ON public.competitor_reports FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Owners insert competitor reports" ON public.competitor_reports FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Owners update competitor reports" ON public.competitor_reports FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Owners delete competitor reports" ON public.competitor_reports FOR DELETE USING (auth.uid() = profile_id);
