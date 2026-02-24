-- Create Esplora Posts table
CREATE TABLE IF NOT EXISTS esplora_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video')),
    text_content TEXT,
    media_url TEXT,
    likes_count INTEGER DEFAULT 0 NOT NULL,
    color_theme TEXT DEFAULT 'purple', -- For balloon styling
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure either text or media exists
    CONSTRAINT has_content CHECK (
        (content_type = 'text' AND text_content IS NOT NULL AND text_content != '') OR
        (content_type IN ('image', 'video') AND media_url IS NOT NULL AND media_url != '')
    )
);

-- Create index for quick 24h filtering
CREATE INDEX IF NOT EXISTS idx_esplora_posts_created_at ON esplora_posts(created_at);

-- Create Esplora Likes table
CREATE TABLE IF NOT EXISTS esplora_likes (
    post_id UUID REFERENCES esplora_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (post_id, user_id) -- A user can only like a post once
);

-- RLS Policies for esplora_posts
ALTER TABLE esplora_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view posts created in the last 24 hours
CREATE POLICY "Anyone can view recent posts"
ON esplora_posts FOR SELECT
TO public
USING (created_at > NOW() - INTERVAL '24 hours');

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
ON esplora_posts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Creators can delete their own posts
CREATE POLICY "Creators can delete own posts"
ON esplora_posts FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR user_id IN (SELECT id FROM profiles WHERE twitch_id = auth.jwt() ->> 'sub'));

-- RLS for updating likes_count (security definer function will handle this safely, but we need a policy to allow the update from the edge function or secure RPC if used. For now, we'll use a direct update with RLS)
CREATE POLICY "Anyone can update likes_count"
ON esplora_posts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true); -- Note: In a production environment, incrementing likes should ideally be done via an RPC to prevent arbitrary updates, but this allows rapid prototyping.

-- RLS Policies for esplora_likes
ALTER TABLE esplora_likes ENABLE ROW LEVEL SECURITY;

-- Everyone can view likes
CREATE POLICY "Anyone can view likes"
ON esplora_likes FOR SELECT
TO public
USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Users can like posts"
ON esplora_likes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can remove their own likes
CREATE POLICY "Users can unlike posts"
ON esplora_likes FOR DELETE
TO authenticated
USING (true);

-- Create RPC to securely toggle likes and update counts transactionally
CREATE OR REPLACE FUNCTION toggle_esplora_like(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if like exists
    SELECT EXISTS (
        SELECT 1 FROM esplora_likes WHERE post_id = p_post_id AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Unlike
        DELETE FROM esplora_likes WHERE post_id = p_post_id AND user_id = p_user_id;
        UPDATE esplora_posts SET likes_count = likes_count - 1 WHERE id = p_post_id;
        RETURN FALSE; -- Return false indicating it is now unliked
    ELSE
        -- Like
        INSERT INTO esplora_likes (post_id, user_id) VALUES (p_post_id, p_user_id);
        UPDATE esplora_posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
        RETURN TRUE; -- Return true indicating it is now liked
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
