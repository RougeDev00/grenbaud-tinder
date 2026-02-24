-- =============================================
-- Fix 3: Tighten Esplora Posts RLS
-- Only post owner can update their posts
-- Pin toggle via secure RPC for admin
-- =============================================

-- Drop overly permissive UPDATE policy
DROP POLICY IF EXISTS "Anyone can update likes_count" ON esplora_posts;

-- Only post owner can update their own posts
CREATE POLICY "Owners can update own posts"
ON esplora_posts FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = esplora_posts.user_id
          AND p.twitch_id = auth.uid()::text
    )
);

-- ── Esplora Likes: fix DELETE policy ──
DROP POLICY IF EXISTS "Users can unlike posts" ON esplora_likes;

-- Users can only remove THEIR OWN likes
CREATE POLICY "Users can unlike own likes"
ON esplora_likes FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = esplora_likes.user_id
          AND p.twitch_id = auth.uid()::text
    )
);

-- ── Admin Pin RPC (SECURITY DEFINER, bypasses RLS) ──
CREATE OR REPLACE FUNCTION admin_toggle_pin(p_post_id UUID, p_pinned BOOLEAN, p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only allow the admin (grenbaud) to pin posts
    IF lower(p_username) = 'grenbaud' THEN
        UPDATE esplora_posts SET is_pinned = p_pinned WHERE id = p_post_id;
        RETURN true;
    ELSE
        RAISE EXCEPTION 'Unauthorized: only admin can pin posts';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
