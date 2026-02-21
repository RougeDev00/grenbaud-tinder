-- Chat System Tables
-- Run this in Supabase SQL Editor

-- 1. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id TEXT NOT NULL REFERENCES profiles(twitch_id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES profiles(twitch_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 3. RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Sender can insert
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT twitch_id FROM profiles WHERE id = auth.uid())
  );

-- Policy: Users can read messages they sent OR received
CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = (SELECT twitch_id FROM profiles WHERE id = auth.uid())
    OR 
    receiver_id = (SELECT twitch_id FROM profiles WHERE id = auth.uid())
  );

-- 4. Cleanup Function (Ephemeral / Auto-destruct)
-- Call this function manually or via pg_cron extension if available
CREATE OR REPLACE FUNCTION delete_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Realtime
-- This is required for the chat to update instantly
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
