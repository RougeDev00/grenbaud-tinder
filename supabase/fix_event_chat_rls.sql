-- Fix Event Chat RLS Policies
-- The previous policies used auth.uid() directly, but this app stores
-- profile.id separately from auth.uid(). The mapping is:
-- auth.uid()::text = profiles.twitch_id -> profiles.id = event_participants.user_id / events.creator_id

-- Drop old policies
DROP POLICY IF EXISTS "event_messages_select" ON event_messages;
DROP POLICY IF EXISTS "event_messages_insert" ON event_messages;

-- Helper: get current user's profile ID from auth
-- auth.uid()::text = profiles.twitch_id

-- RLS Policy: SELECT — approved participants or creator can read
CREATE POLICY "event_messages_select" ON event_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_participants ep
      JOIN profiles p ON p.id = ep.user_id
      WHERE ep.event_id = event_messages.event_id
        AND p.twitch_id = auth.uid()::text
        AND ep.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM events e
      JOIN profiles p ON p.id = e.creator_id
      WHERE e.id = event_messages.event_id
        AND p.twitch_id = auth.uid()::text
    )
  );

-- RLS Policy: INSERT — sender must be current user, and must be approved or creator
CREATE POLICY "event_messages_insert" ON event_messages
  FOR INSERT WITH CHECK (
    -- sender_id must match the current user's profile
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = event_messages.sender_id
        AND p.twitch_id = auth.uid()::text
    )
    AND (
      -- user is an approved participant
      EXISTS (
        SELECT 1 FROM event_participants ep
        JOIN profiles p ON p.id = ep.user_id
        WHERE ep.event_id = event_messages.event_id
          AND p.twitch_id = auth.uid()::text
          AND ep.status = 'approved'
      )
      -- OR user is the event creator
      OR EXISTS (
        SELECT 1 FROM events e
        JOIN profiles p ON p.id = e.creator_id
        WHERE e.id = event_messages.event_id
          AND p.twitch_id = auth.uid()::text
      )
    )
  );
