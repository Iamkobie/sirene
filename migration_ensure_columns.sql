-- ============================================================
-- MIGRATION: Ensure ALL columns exist on user_phrase_attempts
-- Run this in Supabase SQL Editor, then run:
--   NOTIFY pgrst, 'reload schema';
-- ============================================================

-- Add all columns that might be missing
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS clip_id TEXT;
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS fluency_score NUMERIC(5, 2);
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS pronunciation_score NUMERIC(5, 2);
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS completeness_score NUMERIC(5, 2);
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS accuracy_score NUMERIC(5, 2);
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS overall_score NUMERIC(5, 2);
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS points_earned NUMERIC(10, 1) DEFAULT 0.0 NOT NULL;
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS target_language TEXT;
ALTER TABLE public.user_phrase_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Also ensure phrase_id is TEXT (not UUID)
ALTER TABLE public.user_phrase_attempts DROP CONSTRAINT IF EXISTS user_phrase_attempts_phrase_id_fkey;
ALTER TABLE public.user_phrase_attempts ALTER COLUMN phrase_id TYPE TEXT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
