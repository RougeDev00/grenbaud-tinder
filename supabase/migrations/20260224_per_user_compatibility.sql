-- =============================================
-- Migration: Per-user compatibility scores
-- Each user generates and stores their OWN score independently
-- =============================================

-- 1. Add generated_by column
ALTER TABLE compatibility_scores ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Backfill existing rows: set generated_by = user_a (arbitrary, since we don't know who generated)
UPDATE compatibility_scores SET generated_by = user_a WHERE generated_by IS NULL;

-- 3. Make generated_by NOT NULL
ALTER TABLE compatibility_scores ALTER COLUMN generated_by SET NOT NULL;

-- 4. Drop old constraints that enforced one-row-per-pair
ALTER TABLE compatibility_scores DROP CONSTRAINT IF EXISTS unique_pair;
ALTER TABLE compatibility_scores DROP CONSTRAINT IF EXISTS users_ordered;

-- 5. Add new unique constraint: one score per generator per pair
ALTER TABLE compatibility_scores ADD CONSTRAINT unique_generation UNIQUE(generated_by, user_a, user_b);

-- 6. Add DELETE policy so admin RPC can delete scores
CREATE POLICY "Admin can delete scores" ON compatibility_scores FOR DELETE USING (true);

-- 7. Update admin RPC to include generated_by info
CREATE OR REPLACE FUNCTION admin_get_user_scores(target_id UUID, admin_password TEXT)
RETURNS TABLE (
    score_id UUID,
    other_user_id UUID,
    other_display_name TEXT,
    other_twitch_username TEXT,
    other_avatar TEXT,
    generated_by_id UUID,
    generated_by_name TEXT,
    score INT,
    explanation TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF admin_password = 'skimingow' THEN
        RETURN QUERY
        SELECT
            cs.id AS score_id,
            CASE WHEN cs.user_a = target_id THEN cs.user_b ELSE cs.user_a END AS other_user_id,
            p.display_name AS other_display_name,
            p.twitch_username AS other_twitch_username,
            p.avatar_url AS other_avatar,
            cs.generated_by AS generated_by_id,
            g.display_name AS generated_by_name,
            cs.score,
            cs.explanation,
            cs.created_at
        FROM compatibility_scores cs
        JOIN profiles p ON p.id = CASE WHEN cs.user_a = target_id THEN cs.user_b ELSE cs.user_a END
        JOIN profiles g ON g.id = cs.generated_by
        WHERE cs.user_a = target_id OR cs.user_b = target_id
        ORDER BY cs.created_at DESC;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
