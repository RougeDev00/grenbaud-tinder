-- ═══════════════════════════════════════════════════
-- MASTER FIX: Like + Notification in ONE function
-- Notification is created INSIDE the SECURITY DEFINER
-- function so it fully bypasses RLS.
-- ═══════════════════════════════════════════════════

-- Ensure ALL enum values exist
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SPY_RECIPROCAL';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ESPLORA_LIKE';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ESPLORA_COMMENT';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ESPLORA_REPLY';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'EVENT_REMOVE';

-- Drop FK constraint that blocks inserts (user_id stores profiles.id, not auth.users.id)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Drop ALL overloads of toggle function
DROP FUNCTION IF EXISTS toggle_esplora_like(UUID, UUID);
DROP FUNCTION IF EXISTS toggle_esplora_like(UUID, UUID, NUMERIC, NUMERIC);

-- Create single clean function that handles LIKE + NOTIFICATION
CREATE OR REPLACE FUNCTION toggle_esplora_like(
    p_post_id UUID,
    p_user_id UUID,
    p_pos_x NUMERIC DEFAULT 50,
    p_pos_y NUMERIC DEFAULT 90
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
    v_post_owner UUID;
    v_notif_exists BOOLEAN;
BEGIN
    -- Check if like exists
    SELECT EXISTS (
        SELECT 1 FROM esplora_likes WHERE post_id = p_post_id AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Unlike
        DELETE FROM esplora_likes WHERE post_id = p_post_id AND user_id = p_user_id;
        UPDATE esplora_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_post_id;
        RETURN FALSE;
    ELSE
        -- Like
        INSERT INTO esplora_likes (post_id, user_id, pos_x, pos_y)
        VALUES (p_post_id, p_user_id, p_pos_x, p_pos_y);
        UPDATE esplora_posts SET likes_count = likes_count + 1 WHERE id = p_post_id;

        -- Send notification to post owner (if not self-like)
        SELECT user_id INTO v_post_owner FROM esplora_posts WHERE id = p_post_id;
        
        IF v_post_owner IS NOT NULL AND v_post_owner != p_user_id THEN
            -- Check if notification already exists (avoid spam)
            SELECT EXISTS (
                SELECT 1 FROM notifications
                WHERE user_id = v_post_owner
                  AND actor_id = p_user_id
                  AND type = 'ESPLORA_LIKE'::notification_type
                  AND reference_id = p_post_id
            ) INTO v_notif_exists;

            IF NOT v_notif_exists THEN
                INSERT INTO notifications (user_id, actor_id, type, reference_id, read, created_at)
                VALUES (v_post_owner, p_user_id, 'ESPLORA_LIKE'::notification_type, p_post_id, false, NOW());
            END IF;
        END IF;

        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
