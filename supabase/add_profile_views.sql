-- Create a table to track when users generate AI analysis on other profiles
CREATE TABLE IF NOT EXISTS profile_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    viewed_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_view UNIQUE (viewer_id, viewed_id)
);

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read profile views
CREATE POLICY "Everyone can read profile views"
    ON profile_views FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert views
CREATE POLICY "Authenticated users can insert views"
    ON profile_views FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update views (for upsert)
CREATE POLICY "Authenticated users can update views"
    ON profile_views FOR UPDATE
    USING (auth.role() = 'authenticated');
