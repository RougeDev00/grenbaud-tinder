-- Add is_pinned column to esplora_posts
ALTER TABLE esplora_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- ═══════════════════════════════════════════
-- Admin privileges for grenbaud (CEO)
-- Allow grenbaud to DELETE and UPDATE any post/comment
-- ═══════════════════════════════════════════

-- Drop existing restrictive delete policies
DROP POLICY IF EXISTS "Creators can delete own posts" ON esplora_posts;
DROP POLICY IF EXISTS "Users can delete their own esplora posts" ON esplora_posts;

-- New DELETE policy: owner OR grenbaud admin
CREATE POLICY "Owners or admin can delete posts"
ON esplora_posts FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.twitch_id = auth.uid()::text
          AND (p.id = esplora_posts.user_id OR p.twitch_username = 'grenbaud')
    )
);

-- UPDATE policy: allow owner or admin to update (for pinning etc.)
DROP POLICY IF EXISTS "Creators can update own posts" ON esplora_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON esplora_posts;

CREATE POLICY "Owners or admin can update posts"
ON esplora_posts FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.twitch_id = auth.uid()::text
          AND (p.id = esplora_posts.user_id OR p.twitch_username = 'grenbaud')
    )
);

-- Comments: allow admin to delete any comment
DROP POLICY IF EXISTS "Users can delete their own comments" ON esplora_comments;
DROP POLICY IF EXISTS "Creators can delete own comments" ON esplora_comments;

CREATE POLICY "Owners or admin can delete comments"
ON esplora_comments FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.twitch_id = auth.uid()::text
          AND (p.id = esplora_comments.user_id OR p.twitch_username = 'grenbaud')
    )
);
