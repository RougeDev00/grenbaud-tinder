-- Fix DELETE policy for esplora_posts
-- The issue: user_id is profiles.id, but auth.uid() maps to profiles.twitch_id
-- We need to join through profiles to resolve the mapping

-- Drop ALL existing delete policies on esplora_posts
DROP POLICY IF EXISTS "Creators can delete own posts" ON esplora_posts;
DROP POLICY IF EXISTS "Users can delete their own esplora posts" ON esplora_posts;

-- Create the corrected policy that maps auth.uid() -> profiles.twitch_id -> profiles.id
CREATE POLICY "Creators can delete own posts"
ON esplora_posts FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = esplora_posts.user_id
          AND p.twitch_id = auth.uid()::text
    )
);
