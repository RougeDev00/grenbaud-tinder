-- =============================================
-- Esplora Comments Table + comments_count column
-- =============================================

-- New table for comments on esplora posts
CREATE TABLE IF NOT EXISTS esplora_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES esplora_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON esplora_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON esplora_comments(user_id);

-- RLS policies
ALTER TABLE esplora_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON esplora_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON esplora_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON esplora_comments FOR DELETE USING (auth.uid() = user_id);

-- Add comments_count to esplora_posts
ALTER TABLE esplora_posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;

-- Trigger to auto-increment/decrement comments_count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE esplora_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE esplora_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_count ON esplora_comments;
CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON esplora_comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();
