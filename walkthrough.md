# Supabase Schema Walkthrough: Sirene Database

We have created the complete database schema for the **Sirene Filipino Voice Contribution & Language Learning Platform**. The SQL script has been written to the root of the project: [supabase_schema.sql](file:///c:/Users/itsme/Documents/sirene-1/supabase_schema.sql).

---

## 🛠️ Step-by-Step Installation Instructions

To set up these tables, triggers, views, and security rules in your Supabase project:

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Select your project: **`kpxjsnnzbqpbmkbcqrrw`**.
3. In the left navigation bar, click on **SQL Editor** (icon looking like `>_` or a script page).
4. Click **New query** (or **New Blank Query**).
5. Copy the entire contents of [supabase_schema.sql](file:///c:/Users/itsme/Documents/sirene-1/supabase_schema.sql) and paste it into the editor.
6. Click the **Run** button at the top-right of the SQL editor.
7. You should see a message indicating "Success. No rows returned." or showing query execution logs.

---

## 📐 Schema Breakdown & Functionality

Here is a summary of the components defined in the script:

### 1. Core Tables

*   **`profiles`**: Links to Supabase's internal auth users (`auth.users`) to store gamification status:
    *   `id`: Primary key matching `auth.users.id`.
    *   `username`: Display name for leaderboard ranking.
    *   `xp`: Cumulative experience points across all languages.
    *   `streak`: Current consecutive active days.
    *   `last_active_at`: Tracks activity timeline to increment or reset streaks.
*   **`phrases`**: Master list of source and target phrases.
    *   `difficulty`: Restricted to `'Easy'`, `'Normal'`, `'Hard'`, and `'Expert'`.
    *   `points`: Validated via check constraints matching the difficulty requirement:
        *   `Easy` $\rightarrow$ **25 points**
        *   `Normal` $\rightarrow$ **50 points**
        *   `Hard` $\rightarrow$ **75 points**
        *   `Expert` $\rightarrow$ **100 points**
*   **`user_phrase_attempts`**: Records each time a user translates/records a phrase.
    *   Stores AI score attributes: `accuracy_score`, `pronunciation_score`, `fluency_score`, `timing_score`, and `overall_score`.
    *   `points_earned`: Automatically populated by the database trigger based on their score fraction of maximum points.
*   **`user_language_progress`**: Tracks points per specific target language (e.g. Bisaya, Ilocano).
    *   `level`: Automatically moves from `'Beginner'` to `'Intermediate'` ($\ge 1000$ XP) and `'Advanced'` ($\ge 3000$ XP) via trigger computation.

---

### 2. Triggers (Automated Backend Logic)

*   **Profile Auto-Generation (`on_auth_user_created`)**:
    When a user registers via Supabase Auth (e.g., standard signup in `App.tsx`), a trigger catches the event and writes their metadata (`username`, `age`, `sex`, `mother_tongue`) directly into the public `profiles` table.
*   **XP & Streak Processor (`trigger_process_attempt_points`)**:
    Runs *before* inserting an attempt. It:
    1. Grabs the phrase's target language and maximum points.
    2. Calculates the actual points earned: $\text{points\_earned} = \text{overall\_score} \times \text{max\_points} / 100$.
    3. Increments the overall profile `xp`.
    4. Calculates and updates the daily streak.
    5. Adds the points to `user_language_progress` for the corresponding target language and levels up the user's proficiency if boundaries are crossed.

---

### 3. Phrase Selection Engine (Hiding Completed Words)

To satisfy the condition:
> *"dapat ma t-track natin kung na try na ba ng user 'yung phrase at kung 'yung overall points/score niya is greatar than 90 kasi kung OO hindi na dapat siya lalabas sa user na 'yon pero kung less than 90 dapat lumabas pa rin sa user 'yung words"*

We implemented the `get_available_phrases` database function:
```sql
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
            AND a.overall_score >= 90
      )
    ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql;
```

**How to call this from React:**
```typescript
const { data: phrases, error } = await supabase
  .rpc('get_available_phrases', {
    p_user_id: user.id,
    p_source_lang: 'English',
    p_target_lang: 'Bisaya',
    p_difficulty: 'Normal'
  });
```

---

### 4. Live Leaderboards (Dynamic Views)

Leaderboard tabs query direct database views, ensuring real-time listings:
1.  **`global_leaderboard`**: Ranks overall profiles by descending `xp`.
2.  **`language_leaderboard`**: Ranks user progress within a target language.
3.  **`weekly_leaderboard`**: Dynamically sums attempt points from the last 7 days (`NOW() - INTERVAL '7 days'`) to rank weekly speedruns.

---

### 5. Security and Row Level Security (RLS)

All tables have RLS activated. This restricts:
*   Users from modifying profiles other than their own.
*   Users from viewing or tampering with attempts that belong to other users.
*   Write access to the static `phrases` catalog (admin/dashboard-only access).

---

## 🏙️ Cities Dynamic Integration

To make the platform's location features fully extensible and DB-driven, we implemented the following changes:

### 1. Cities Database Table
We created the `cities` table in [supabase_schema.sql](file:///c:/Users/itsme/Documents/sirene-1/supabase_schema.sql) and seeded it with Philippine cities:
* **Table**: `public.cities`
* **Fields**:
  * `id`: Auto-incrementing SERIAL primary key.
  * `name`: The city name (unique, e.g., `'Manila'`, `'Cebu City'`).
* **RLS Rules**: Enabled public read access (`SELECT`) so the client app can retrieve the list of available cities.

### 2. Frontend Dynamic Binding
* **App Root Hook**: On app startup, we query the `cities` table and dynamically store the result in the `citiesList` React state, falling back to a pre-defined list if offline.
* **SignUp Screen**: The SignUp modal dropdown fetches option nodes dynamically from `citiesList` instead of hardcoding.
* **Leaderboards Screen**: The filter dropdown dynamically populates the target cities from the database list, and the rankings player items show their location badge (e.g. `📍 Quezon City`) directly from their profiles.
