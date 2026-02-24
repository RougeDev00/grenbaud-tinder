-- =============================================
-- Fix 2: Tighten Events & Event Participants RLS
-- Only event creators can update/delete their events
-- =============================================

-- ── Events ──

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Creators can update their events." ON events;
DROP POLICY IF EXISTS "Creators can delete their events." ON events;

-- Creators can update ONLY their own events
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

-- Creators can delete ONLY their own events
-- Also allow deleting expired events (for cleanup)
CREATE POLICY "Creators can delete their events."
ON events FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = events.creator_id
          AND p.twitch_id = auth.uid()::text
    )
    OR event_time < NOW()  -- Allow cleanup of expired events by anyone
);

-- ── Event Participants ──

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can cancel or creator can delete." ON event_participants;
DROP POLICY IF EXISTS "Creators can update participant status." ON event_participants;

-- Users can delete their OWN participation, OR event creator can remove anyone
CREATE POLICY "Users can cancel or creator can delete."
ON event_participants FOR DELETE
TO authenticated
USING (
    -- User removing themselves
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = event_participants.user_id
          AND p.twitch_id = auth.uid()::text
    )
    OR
    -- Event creator removing a participant
    EXISTS (
        SELECT 1 FROM events e
        JOIN profiles p ON p.id = e.creator_id
        WHERE e.id = event_participants.event_id
          AND p.twitch_id = auth.uid()::text
    )
);

-- Only event creator can update participant status (approve/reject)
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
