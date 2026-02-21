-- Add personality_answers column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_answers JSONB;
