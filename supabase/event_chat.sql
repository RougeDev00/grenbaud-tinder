-- Event Chat Messages Table
CREATE TABLE IF NOT EXISTS event_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

-- Index for fast queries by event
CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON event_messages(event_id, created_at DESC);

-- Enable RLS
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT — only approved participants or creator can read
CREATE POLICY "event_messages_select" ON event_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_participants ep
      WHERE ep.event_id = event_messages.event_id
        AND ep.user_id = auth.uid()
        AND ep.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_messages.event_id
        AND e.creator_id = auth.uid()
    )
  );

-- RLS Policy: INSERT — only approved participants or creator can write
CREATE POLICY "event_messages_insert" ON event_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM event_participants ep
        WHERE ep.event_id = event_messages.event_id
          AND ep.user_id = auth.uid()
          AND ep.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_messages.event_id
          AND e.creator_id = auth.uid()
      )
    )
  );

-- Enable Realtime for event_messages
ALTER PUBLICATION supabase_realtime ADD TABLE event_messages;
