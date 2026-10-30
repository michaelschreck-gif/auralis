-- Name der Person, die bewertet wird (kann vom Konto-Namen abweichen,
-- z. B. wenn jemand die Reputation einer anderen Person betreut).
-- NULL = Konto-Name (profiles.full_name) wird verwendet.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subject_name text;
