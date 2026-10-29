-- Add admin and ban fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- Grant admin to owner account
UPDATE public.profiles
SET is_admin = true
WHERE email = 'michael.schreck@entrenous.de';
