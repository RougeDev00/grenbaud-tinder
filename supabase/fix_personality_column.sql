-- Fix personality_type column: increase size to TEXT and remove old constraint
ALTER TABLE profiles 
  ALTER COLUMN personality_type TYPE TEXT,
  DROP CONSTRAINT IF EXISTS profiles_personality_type_check;

-- Optional: New constraint that allows MBTI codes with A/T suffix (e.g. INFJ-A) or friendly names
-- For now, let's keep it flexible (TEXT) to avoid further "too long" errors.
COMMENT ON COLUMN profiles.personality_type IS 'Personality type code (e.g. INTJ-A) or friendly name.';
