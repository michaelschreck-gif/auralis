-- Add competitors table for competitor intelligence tracking
CREATE TABLE public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  topics text[] NOT NULL DEFAULT '{}',
  last_score numeric(5,2),
  last_analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_competitors_profile_id ON public.competitors (profile_id);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitors: owner all" ON public.competitors FOR ALL USING (auth.uid() = profile_id);
