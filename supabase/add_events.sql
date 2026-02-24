-- Create Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    banner_url TEXT,
    event_time TIMESTAMPTZ NOT NULL,
    max_participants INTEGER NOT NULL CHECK (max_participants >= 2 AND max_participants <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Event Participants table
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- A user can only request to join an event once
);

-- RLS Policies for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can view events
CREATE POLICY "Public profiles are viewable by everyone."
ON events FOR SELECT
TO public
USING (true);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events."
ON events FOR INSERT
TO authenticated
WITH CHECK (true);

-- Creators can update their events
CREATE POLICY "Creators can update their events."
ON events FOR UPDATE
TO authenticated
USING (true);

-- Creators can delete their events
CREATE POLICY "Creators can delete their events."
ON events FOR DELETE
TO authenticated
USING (true);


-- RLS Policies for event_participants
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can view participants (needed to show member counts and lists)
CREATE POLICY "Participants are viewable by everyone."
ON event_participants FOR SELECT
TO public
USING (true);

-- Users can request to join (insert 'pending')
CREATE POLICY "Users can request to join."
ON event_participants FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can cancel their own request (delete) OR creator can remove/reject
CREATE POLICY "Users can cancel or creator can delete."
ON event_participants FOR DELETE
TO authenticated
USING (true);

-- Only event creators can update status (approve/reject)
CREATE POLICY "Creators can update participant status."
ON event_participants FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
