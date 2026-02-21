-- Add missing 'looking_for' column to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS looking_for TEXT DEFAULT '';

-- Verify permissions (just in case)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
