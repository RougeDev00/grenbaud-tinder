-- Add 'gender' and 'free_time' columns to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS free_time TEXT DEFAULT '';

-- Verify permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
