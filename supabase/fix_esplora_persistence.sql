-- MASTER FIX: Esplora Coords & Persistence
-- 1. Ensure columns exist on esplora_posts
ALTER TABLE esplora_posts ADD COLUMN IF NOT EXISTS pos_x NUMERIC;
ALTER TABLE esplora_posts ADD COLUMN IF NOT EXISTS pos_y NUMERIC;

-- 2. Ensure columns exist on esplora_likes
ALTER TABLE esplora_likes ADD COLUMN IF NOT EXISTS pos_x NUMERIC DEFAULT 50;
ALTER TABLE esplora_likes ADD COLUMN IF NOT EXISTS pos_y NUMERIC DEFAULT 90;

-- 3. Fix RLS for likes to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can like posts" ON esplora_likes;
CREATE POLICY "Users can like posts"
ON esplora_likes FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can unlike posts" ON esplora_likes;
CREATE POLICY "Users can unlike posts"
ON esplora_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR user_id IN (SELECT id FROM profiles WHERE twitch_id = auth.jwt() ->> 'sub'));

-- 4. Update the toggle function to support coordinates (Optional but good for fallback)
CREATE OR REPLACE FUNCTION toggle_esplora_like(p_post_id UUID, p_user_id UUID, p_pos_x NUMERIC DEFAULT 50, p_pos_y NUMERIC DEFAULT 90)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM esplora_likes WHERE post_id = p_post_id AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM esplora_likes WHERE post_id = p_post_id AND user_id = p_user_id;
        UPDATE esplora_posts SET likes_count = likes_count - 1 WHERE id = p_post_id;
        RETURN FALSE;
    ELSE
        INSERT INTO esplora_likes (post_id, user_id, pos_x, pos_y) VALUES (p_post_id, p_user_id, p_pos_x, p_pos_y);
        UPDATE esplora_posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
