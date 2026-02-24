-- =============================================
-- SECURITY FIX: Grants + Events RLS + Esplora RLS
-- Eseguire TUTTO in un colpo nel SQL Editor di Supabase
-- =============================================

-- ═══════════════════════════════════════════════
-- 1. REVOKE GRANT ALL DA ANON
-- ═══════════════════════════════════════════════
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Re-grant solo SELECT dove serve
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON event_participants TO anon;
GRANT SELECT ON esplora_posts TO anon;
GRANT SELECT ON esplora_likes TO anon;

-- Authenticated users keep full DML
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════
-- 2. FIX EVENTS RLS
-- ═══════════════════════════════════════════════

-- Drop old permissive policies
DROP POLICY IF EXISTS "Creators can update their events." ON events;
DROP POLICY IF EXISTS "Creators can delete their events." ON events;

-- Only creator can update their events
CREATE POLICY "Creators can update their events."
ON events FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = events.creator_id
          AND p.twitch_id = auth.uid()::text
    )
);

-- Creator can delete own events + anyone can cleanup expired
CREATE POLICY "Creators can delete their events."
ON events FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = events.creator_id
          AND p.twitch_id = auth.uid()::text
    )
    OR event_time < NOW()
);

-- Fix event_participants
DROP POLICY IF EXISTS "Users can cancel or creator can delete." ON event_participants;
DROP POLICY IF EXISTS "Creators can update participant status." ON event_participants;

-- Users can remove themselves OR creator can remove anyone
CREATE POLICY "Users can cancel or creator can delete."
ON event_participants FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = event_participants.user_id
          AND p.twitch_id = auth.uid()::text
    )
    OR
    EXISTS (
        SELECT 1 FROM events e
        JOIN profiles p ON p.id = e.creator_id
        WHERE e.id = event_participants.event_id
          AND p.twitch_id = auth.uid()::text
    )
);

-- Only creator can approve/reject
CREATE POLICY "Creators can update participant status."
ON event_participants FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM events e
        JOIN profiles p ON p.id = e.creator_id
        WHERE e.id = event_participants.event_id
          AND p.twitch_id = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM events e
        JOIN profiles p ON p.id = e.creator_id
        WHERE e.id = event_participants.event_id
          AND p.twitch_id = auth.uid()::text
    )
);

-- ═══════════════════════════════════════════════
-- 3. FIX ESPLORA RLS
-- ═══════════════════════════════════════════════

-- Drop overly permissive UPDATE
DROP POLICY IF EXISTS "Anyone can update likes_count" ON esplora_posts;

-- Only owner can update own posts
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

-- Fix likes DELETE: only own likes
DROP POLICY IF EXISTS "Users can unlike posts" ON esplora_likes;

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

-- Admin Pin RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION admin_toggle_pin(p_post_id UUID, p_pinned BOOLEAN, p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF lower(p_username) = 'grenbaud' THEN
        UPDATE esplora_posts SET is_pinned = p_pinned WHERE id = p_post_id;
        RETURN true;
    ELSE
        RAISE EXCEPTION 'Unauthorized: only admin can pin posts';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
