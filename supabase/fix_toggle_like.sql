-- ═══════════════════════════════════════════════════
-- FIX: toggle_esplora_like function overload
-- There are TWO versions causing PGRST203 error.
-- Drop both, create one clean version.
-- ═══════════════════════════════════════════════════

-- Drop ALL overloads
DROP FUNCTION IF EXISTS toggle_esplora_like(UUID, UUID);
DROP FUNCTION IF EXISTS toggle_esplora_like(UUID, UUID, NUMERIC, NUMERIC);

-- Create single clean function (pos_x/pos_y optional with defaults)
CREATE OR REPLACE FUNCTION toggle_esplora_like(
    p_post_id UUID,
    p_user_id UUID,
    p_pos_x NUMERIC DEFAULT 50,
    p_pos_y NUMERIC DEFAULT 90
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM esplora_likes WHERE post_id = p_post_id AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM esplora_likes WHERE post_id = p_post_id AND user_id = p_user_id;
        UPDATE esplora_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_post_id;
        RETURN FALSE;
    ELSE
        INSERT INTO esplora_likes (post_id, user_id, pos_x, pos_y)
        VALUES (p_post_id, p_user_id, p_pos_x, p_pos_y);
        UPDATE esplora_posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
