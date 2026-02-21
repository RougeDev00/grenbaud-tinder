-- 1. Add read_at column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Allow users to update messages sent TO them (to mark as read)
CREATE POLICY "Users can update messages they received"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    receiver_id = (SELECT get_my_twitch_id())
  )
  WITH CHECK (
    receiver_id = (SELECT get_my_twitch_id())
  );
