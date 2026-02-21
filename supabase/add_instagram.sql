-- Add instagram column to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '';

-- Update GrenBaud's profile with Instagram handle
UPDATE profiles SET instagram = '@grenbaudyt' WHERE twitch_username ILIKE '%grenbaud%' OR display_name ILIKE '%grenbaud%';
