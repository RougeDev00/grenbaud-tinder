-- =============================================
-- Baudr Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twitch_id TEXT UNIQUE NOT NULL,
  twitch_username TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  hobbies TEXT DEFAULT '',
  music TEXT DEFAULT '',
  youtube TEXT DEFAULT '',
  twitch_watches TEXT DEFAULT '',
  grenbaud_is TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  zodiac_sign TEXT DEFAULT '',
  photo_1 TEXT DEFAULT '',
  photo_2 TEXT DEFAULT '',
  photo_3 TEXT DEFAULT '',
  is_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SWIPES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  swiped_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

-- =============================================
-- MATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_1, user_2)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user_1);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user_2);
CREATE INDEX IF NOT EXISTS idx_profiles_twitch ON profiles(twitch_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone authenticated can read, only own profile can be updated
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (twitch_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (twitch_id = auth.jwt() ->> 'sub');

-- Swipes: users can create their own, read their own
CREATE POLICY "Users can create their own swipes"
  ON swipes FOR INSERT
  TO authenticated
  WITH CHECK (swiper_id IN (SELECT id FROM profiles WHERE twitch_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can read their own swipes"
  ON swipes FOR SELECT
  TO authenticated
  USING (swiper_id IN (SELECT id FROM profiles WHERE twitch_id = auth.jwt() ->> 'sub'));

-- Matches: users can read matches they are part of
CREATE POLICY "Users can read their own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    user_1 IN (SELECT id FROM profiles WHERE twitch_id = auth.jwt() ->> 'sub')
    OR user_2 IN (SELECT id FROM profiles WHERE twitch_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "System can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'photos');

-- =============================================
-- FUNCTION: Check for mutual match
-- =============================================
CREATE OR REPLACE FUNCTION check_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check on 'like' swipes
  IF NEW.direction = 'like' THEN
    -- Check if the other person already liked us
    IF EXISTS (
      SELECT 1 FROM swipes
      WHERE swiper_id = NEW.swiped_id
        AND swiped_id = NEW.swiper_id
        AND direction = 'like'
    ) THEN
      -- Create match (order IDs to avoid duplicates)
      INSERT INTO matches (user_1, user_2)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATEST(NEW.swiper_id, NEW.swiped_id)
      )
      ON CONFLICT (user_1, user_2) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-check for match after swipe
DROP TRIGGER IF EXISTS on_swipe_check_match ON swipes;
CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON swipes
  FOR EACH ROW EXECUTE FUNCTION check_match();
