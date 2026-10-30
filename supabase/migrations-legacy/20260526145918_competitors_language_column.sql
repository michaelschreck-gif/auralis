ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS language public.language_type NOT NULL DEFAULT 'en';
