-- Zielmärkte für die Score-Messung (siehe lib/auralis/markets.ts).
-- Leeres Array = Standardmarkt (DACH bei Sprache de, sonst Global).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_markets text[] NOT NULL DEFAULT '{}';
