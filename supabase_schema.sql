-- ==========================================
-- SIRENE DATABASE SCHEMA (REVISED)
-- Gamified Filipino Voice Contribution Platform
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLE DEFINITIONS
-- ==========================================

-- A. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    age INTEGER,
    sex TEXT,
    mother_tongue TEXT,
    city TEXT,
    xp NUMERIC(10, 1) DEFAULT 0.0 NOT NULL,
    streak INTEGER DEFAULT 0 NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Phrases Table (Master list of phrases with UNIQUE constraint for dynamic AI caching)
CREATE TABLE IF NOT EXISTS public.phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    source_text TEXT NOT NULL,
    target_text_suggestion TEXT,
    transliteration TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Normal', 'Hard', 'Expert')),
    points INTEGER NOT NULL CHECK (
        (difficulty = 'Easy' AND points = 25) OR
        (difficulty = 'Normal' AND points = 50) OR
        (difficulty = 'Hard' AND points = 75) OR
        (difficulty = 'Expert' AND points = 100)
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Enforce uniqueness of phrases for the same translation direction to prevent duplicates when generated dynamically by AI
    CONSTRAINT unique_phrase_translation UNIQUE (source_text, target_language)
);

-- C. User Phrase Attempts Table (Aligned with Gemini API response keys and decimal scoring)
CREATE TABLE IF NOT EXISTS public.user_phrase_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    phrase_id UUID NOT NULL REFERENCES public.phrases(id) ON DELETE CASCADE,
    clip_id TEXT,
    audio_url TEXT,
    transcription TEXT,
    fluency_score NUMERIC(5, 2) CHECK (fluency_score BETWEEN 0.0 AND 100.0),
    pronunciation_score NUMERIC(5, 2) CHECK (pronunciation_score BETWEEN 0.0 AND 100.0),
    completeness_score NUMERIC(5, 2) CHECK (completeness_score BETWEEN 0.0 AND 100.0),
    accuracy_score NUMERIC(5, 2) CHECK (accuracy_score BETWEEN 0.0 AND 100.0),
    overall_score NUMERIC(5, 2) CHECK (overall_score BETWEEN 0.0 AND 100.0),
    points_earned NUMERIC(10, 1) DEFAULT 0.0 NOT NULL,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. User Language Progress Table (Tracks points per language with decimal values)
CREATE TABLE IF NOT EXISTS public.user_language_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    xp NUMERIC(10, 1) DEFAULT 0.0 NOT NULL,
    level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, language)
);

-- ==========================================
-- 2. DATABASE TRIGGER FUNCTIONS
-- ==========================================

-- A. Auto-create public Profile on user signup (Extracts city from metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, age, sex, mother_tongue, city, xp, streak)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'PLAYER_' || substring(NEW.id::text, 1, 8)),
        COALESCE((NEW.raw_user_meta_data->>'age')::integer, 18),
        COALESCE(NEW.raw_user_meta_data->>'sex', 'Prefer not to say'),
        COALESCE(NEW.raw_user_meta_data->>'mother_tongue', 'English'),
        COALESCE(NEW.raw_user_meta_data->>'city', 'Manila'),
        0.0,
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users signup
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- B. Process points, streaks, and language progress after each attempt
CREATE OR REPLACE FUNCTION public.process_attempt_points()
RETURNS TRIGGER AS $$
DECLARE
    v_difficulty TEXT;
    v_max_points INTEGER;
    v_target_lang TEXT;
    v_new_lang_xp NUMERIC(10, 1);
BEGIN
    -- Get phrase details
    SELECT difficulty, points, target_language
    INTO v_difficulty, v_max_points, v_target_lang
    FROM public.phrases
    WHERE id = NEW.phrase_id;

    -- Calculate decimal points earned: (overall_score / 100) * max_difficulty_points
    IF NEW.points_earned IS NULL OR NEW.points_earned = 0.0 THEN
        NEW.points_earned := ROUND(((NEW.overall_score / 100.0) * v_max_points)::numeric, 1);
    END IF;

    -- 1. Add points to User Profile overall XP
    UPDATE public.profiles
    SET xp = xp + NEW.points_earned
    WHERE id = NEW.user_id;

    -- 2. Update user activity streak
    UPDATE public.profiles
    SET streak = CASE
        -- If last active yesterday, increment streak
        WHEN last_active_at >= CURRENT_DATE - INTERVAL '1 day' AND last_active_at < CURRENT_DATE THEN streak + 1
        -- If active today already, keep same streak
        WHEN last_active_at >= CURRENT_DATE THEN streak
        -- If older, reset streak to 1
        ELSE 1
    END,
    last_active_at = NOW()
    WHERE id = NEW.user_id;

    -- 3. Update points per target language
    INSERT INTO public.user_language_progress (user_id, language, xp, level)
    VALUES (NEW.user_id, v_target_lang, NEW.points_earned, 'Beginner')
    ON CONFLICT (user_id, language) DO UPDATE
    SET xp = public.user_language_progress.xp + EXCLUDED.xp,
        updated_at = NOW()
    RETURNING xp INTO v_new_lang_xp;

    -- Update language level based on language XP bounds
    UPDATE public.user_language_progress
    SET level = CASE
        WHEN v_new_lang_xp < 1000.0 THEN 'Beginner'
        WHEN v_new_lang_xp < 3000.0 THEN 'Intermediate'
        ELSE 'Advanced'
    END
    WHERE user_id = NEW.user_id AND language = v_target_lang;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run before an attempt is stored
CREATE OR REPLACE TRIGGER trigger_process_attempt_points
BEFORE INSERT ON public.user_phrase_attempts
FOR EACH ROW
EXECUTE FUNCTION public.process_attempt_points();

-- ==========================================
-- 3. FILTER FUNCTION (REPETITIVE CHALLENGE ENGINE)
-- ==========================================

-- Get phrases that a user has NOT completed with a score >= 90
CREATE OR REPLACE FUNCTION public.get_available_phrases(
    p_user_id UUID,
    p_source_lang TEXT,
    p_target_lang TEXT,
    p_difficulty TEXT
)
RETURNS SETOF public.phrases AS $$
BEGIN
    RETURN QUERY
    SELECT p.*
    FROM public.phrases p
    WHERE p.source_language = p_source_lang
      AND p.target_language = p_target_lang
      AND p.difficulty = p_difficulty
      AND NOT EXISTS (
          SELECT 1
          FROM public.user_phrase_attempts a
          WHERE a.user_id = p_user_id
            AND a.phrase_id = p.id
            AND a.overall_score >= 90.0
      )
    ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. CITY-FILTERED LEADERBOARD FUNCTIONS
-- ==========================================

-- A. Get Overall Leaderboard (Optionally filtered by city. Global by default.)
CREATE OR REPLACE FUNCTION public.get_overall_leaderboard(p_city TEXT DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    city TEXT,
    xp NUMERIC(10, 1),
    streak INTEGER,
    creature_rank TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        id AS user_id,
        profiles.username,
        profiles.city,
        profiles.xp,
        profiles.streak,
        CASE
            WHEN profiles.xp < 1000.0 THEN 'Nuno'
            WHEN profiles.xp < 3000.0 THEN 'Tikbalang'
            WHEN profiles.xp < 6000.0 THEN 'Manananggal'
            WHEN profiles.xp < 10000.0 THEN 'Aswang'
            ELSE 'Sirena'
        END::text AS creature_rank
    FROM public.profiles
    WHERE (p_city IS NULL OR p_city = '' OR p_city = 'Global' OR profiles.city = p_city)
    ORDER BY profiles.xp DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- B. Get Language-specific Leaderboard (Optionally filtered by city. Global by default.)
CREATE OR REPLACE FUNCTION public.get_language_leaderboard(p_language TEXT, p_city TEXT DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    city TEXT,
    language_xp NUMERIC(10, 1),
    language_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        lp.user_id,
        p.username,
        p.city,
        lp.xp AS language_xp,
        lp.level::text AS language_level
    FROM public.user_language_progress lp
    JOIN public.profiles p ON lp.user_id = p.id
    WHERE lp.language = p_language
      AND (p_city IS NULL OR p_city = '' OR p_city = 'Global' OR p.city = p_city)
    ORDER BY lp.xp DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- C. Get Weekly Leaderboard (Optionally filtered by city)
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(p_city TEXT DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    city TEXT,
    weekly_xp NUMERIC(10, 1)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.user_id,
        p.username,
        p.city,
        SUM(a.points_earned)::numeric(10,1) AS weekly_xp
    FROM public.user_phrase_attempts a
    JOIN public.profiles p ON a.user_id = p.id
    WHERE a.created_at >= NOW() - INTERVAL '7 days'
      AND (p_city IS NULL OR p_city = '' OR p_city = 'Global' OR p.city = p_city)
    GROUP BY a.user_id, p.username, p.city
    ORDER BY weekly_xp DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_phrase_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_language_progress ENABLE ROW LEVEL SECURITY;

-- A. Profiles Policies
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- B. Phrases Policies
DROP POLICY IF EXISTS "Allow public read access to phrases" ON public.phrases;
CREATE POLICY "Allow public read access to phrases" 
ON public.phrases FOR SELECT USING (true);

-- C. User Phrase Attempts Policies
DROP POLICY IF EXISTS "Allow users to view their own attempts" ON public.user_phrase_attempts;
CREATE POLICY "Allow users to view their own attempts" 
ON public.user_phrase_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own attempts" ON public.user_phrase_attempts;
CREATE POLICY "Allow users to insert their own attempts" 
ON public.user_phrase_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- D. User Language Progress Policies
DROP POLICY IF EXISTS "Allow public read access to language progress" ON public.user_language_progress;
CREATE POLICY "Allow public read access to language progress" 
ON public.user_language_progress FOR SELECT USING (true);

-- ==========================================
-- 6. INITIAL SEED DATA (MOCK PHRASES)
-- ==========================================

-- Ensure the unique constraint exists (needed for ON CONFLICT below)
-- If the table was created before the constraint was added, this will add it now.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_phrase_translation'
    ) THEN
        ALTER TABLE public.phrases
        ADD CONSTRAINT unique_phrase_translation UNIQUE (source_text, target_language);
    END IF;
END $$;

-- Easy Phrases (25 points)
INSERT INTO public.phrases (source_language, target_language, source_text, target_text_suggestion, transliteration, difficulty, points)
VALUES 
('Tagalog', 'Bisaya', 'Magandang umaga.', 'Maayong buntag.', 'Maayong buntag.', 'Easy', 25),
('Tagalog', 'Bisaya', 'Salamat.', 'Salamat.', 'Salamat.', 'Easy', 25),
('English', 'Bisaya', 'Good morning.', 'Maayong buntag.', 'Maayong buntag.', 'Easy', 25),
('English', 'Bisaya', 'Thank you.', 'Salamat.', 'Salamat.', 'Easy', 25)
ON CONFLICT (source_text, target_language) DO NOTHING;

-- Normal/Medium Phrases (50 points)
INSERT INTO public.phrases (source_language, target_language, source_text, target_text_suggestion, transliteration, difficulty, points)
VALUES 
('Tagalog', 'Bisaya', 'Kumain ka na ba?', 'Nakakaon na ba ka?', 'Na-ka-ka-on na ba ka?', 'Normal', 50),
('Tagalog', 'Bisaya', 'Asan ka na?', 'Hain ka na?', 'Ha-in ka na?', 'Normal', 50),
('English', 'Bisaya', 'Have you eaten yet?', 'Nakakaon na ba ka?', 'Na-ka-ka-on na ba ka?', 'Normal', 50),
('English', 'Bisaya', 'Where are you going?', 'Asa ka paingon?', 'A-sa ka pa-i-ngon?', 'Normal', 50)
ON CONFLICT (source_text, target_language) DO NOTHING;

-- Hard Phrases (75 points)
INSERT INTO public.phrases (source_language, target_language, source_text, target_text_suggestion, transliteration, difficulty, points)
VALUES 
('Tagalog', 'Bisaya', 'Masaya akong makita ka.', 'Nalipay ko nga nakakita nimo.', 'Na-li-pay ko nga na-ka-ki-ta ni-mo.', 'Hard', 75),
('Tagalog', 'Bisaya', 'Mag-ingat ka palagi.', 'Pag-amping kanunay.', 'Pag-am-ping ka-nu-nay.', 'Hard', 75),
('English', 'Bisaya', 'I am happy to see you.', 'Nalipay ko nga nakakita nimo.', 'Na-li-pay ko nga na-ka-ki-ta ni-mo.', 'Hard', 75),
('English', 'Bisaya', 'Take care always.', 'Pag-amping kanunay.', 'Pag-am-ping ka-nu-nay.', 'Hard', 75)
ON CONFLICT (source_text, target_language) DO NOTHING;

-- Expert Phrases (100 points)
INSERT INTO public.phrases (source_language, target_language, source_text, target_text_suggestion, transliteration, difficulty, points)
VALUES 
('Tagalog', 'Bisaya', 'Maaari mo ba akong tulungan sa aking ginagawa?', 'Mahimo ba nimo akong tabangan sa akong ginabuhat?', 'Ma-hi-mo ba ni-mo a-kong ta-ba-ngan sa a-kong gi-na-bu-hat?', 'Expert', 100),
('English', 'Bisaya', 'Could you please help me with what I am doing?', 'Mahimo ba nimo akong tabangan sa akong ginabuhat?', 'Ma-hi-mo ba ni-mo a-kong ta-ba-ngan sa a-kong gi-na-bu-hat?', 'Expert', 100)
ON CONFLICT (source_text, target_language) DO NOTHING;

-- ==========================================
-- 7. CITIES TABLE & SEED DATA
-- ==========================================

CREATE TABLE IF NOT EXISTS public.cities (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cities
DROP POLICY IF EXISTS "Allow public read access to cities" ON public.cities;
CREATE POLICY "Allow public read access to cities" 
ON public.cities FOR SELECT USING (true);

-- Populate list of Philippine cities
INSERT INTO public.cities (name) VALUES
('Quezon City'),
('Manila'),
('Cebu City'),
('Davao City'),
('Pasig'),
('Makati'),
('Baguio'),
('Other')
ON CONFLICT (name) DO NOTHING;
