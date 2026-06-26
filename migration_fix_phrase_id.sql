-- ============================================================
-- MIGRATION: Fix phrase_id to support AI-generated phrase IDs
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop the foreign key constraint and change phrase_id to TEXT
--    AI-generated phrases use IDs like "phrase_86d144a1" (not UUIDs)
--    so we can't reference the phrases table.

ALTER TABLE public.user_phrase_attempts
  DROP CONSTRAINT IF EXISTS user_phrase_attempts_phrase_id_fkey;

ALTER TABLE public.user_phrase_attempts
  ALTER COLUMN phrase_id TYPE TEXT;

-- 2. Update the trigger to NOT look up the phrases table.
--    The frontend already computes the correct XP (with hint deductions),
--    so we just trust points_earned as-is when it's > 0.
--    If points_earned is 0 or null and overall_score exists, fall back
--    to a simple formula using difficulty from the attempt metadata.

CREATE OR REPLACE FUNCTION public.process_attempt_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Use points_earned as provided by the frontend (already includes hint deductions).
    -- Only recalculate if points_earned was not supplied.
    IF NEW.points_earned IS NULL OR NEW.points_earned = 0.0 THEN
        -- Fallback: derive from overall_score only (no phrase lookup needed)
        NEW.points_earned := ROUND((NEW.overall_score / 100.0 * 50.0)::numeric, 1);
    END IF;

    -- 1. Add XP to profile
    UPDATE public.profiles
    SET xp = xp + NEW.points_earned
    WHERE id = NEW.user_id;

    -- 2. Update streak
    UPDATE public.profiles
    SET streak = CASE
        WHEN last_active_at >= CURRENT_DATE - INTERVAL '1 day'
             AND last_active_at < CURRENT_DATE THEN streak + 1
        WHEN last_active_at >= CURRENT_DATE THEN streak
        ELSE 1
    END,
    last_active_at = NOW()
    WHERE id = NEW.user_id;

    -- 3. Update per-language XP (target_language comes from the attempt row)
    --    We store target_language in user_phrase_attempts so the trigger can use it.
    IF NEW.target_language IS NOT NULL AND NEW.target_language <> '' THEN
        INSERT INTO public.user_language_progress (user_id, language, xp, level)
        VALUES (NEW.user_id, NEW.target_language, NEW.points_earned, 'Beginner')
        ON CONFLICT (user_id, language) DO UPDATE
          SET xp = public.user_language_progress.xp + EXCLUDED.xp,
              updated_at = NOW();

        UPDATE public.user_language_progress
        SET level = CASE
            WHEN xp < 1000.0  THEN 'Beginner'
            WHEN xp < 3000.0  THEN 'Intermediate'
            ELSE 'Advanced'
        END
        WHERE user_id = NEW.user_id AND language = NEW.target_language;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add target_language column to user_phrase_attempts so the trigger
--    can update per-language XP without querying the phrases table.

ALTER TABLE public.user_phrase_attempts
  ADD COLUMN IF NOT EXISTS target_language TEXT;

-- Done. The table now accepts AI-generated phrase IDs and the trigger
-- correctly updates profiles.xp and user_language_progress.
