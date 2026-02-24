-- Fix: alter all varchar(4) columns in profiles to TEXT
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
  ALTER COLUMN gender TYPE TEXT,
  ALTER COLUMN looking_for TYPE TEXT,
  ALTER COLUMN personality_type TYPE TEXT,
  ALTER COLUMN city TYPE TEXT,
  ALTER COLUMN age TYPE INTEGER USING age::INTEGER;
