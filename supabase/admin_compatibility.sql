-- =============================================
-- Admin RPC: Get compatibility scores for a user
-- Returns all scores where the user is user_a or user_b,
-- joined with the OTHER user's display_name and twitch_username
-- =============================================
CREATE OR REPLACE FUNCTION admin_get_user_scores(target_id UUID, admin_password TEXT)
RETURNS TABLE (
    score_id UUID,
    other_user_id UUID,
    other_display_name TEXT,
    other_twitch_username TEXT,
    other_avatar TEXT,
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
            cs.score,
            cs.explanation,
            cs.created_at
        FROM compatibility_scores cs
        JOIN profiles p ON p.id = CASE WHEN cs.user_a = target_id THEN cs.user_b ELSE cs.user_a END
        WHERE cs.user_a = target_id OR cs.user_b = target_id
        ORDER BY cs.created_at DESC;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Admin RPC: Delete a specific compatibility score
-- =============================================
CREATE OR REPLACE FUNCTION admin_delete_score(score_id UUID, admin_password TEXT)
RETURNS void AS $$
BEGIN
    IF admin_password = 'skimingow' THEN
        DELETE FROM compatibility_scores WHERE id = score_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
