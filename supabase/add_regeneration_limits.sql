-- Add regeneration counters to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_summary_regenerations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS personality_ai_regenerations INTEGER DEFAULT 0;

-- Comment on columns
COMMENT ON COLUMN profiles.ai_summary_regenerations IS 'Count of times the user has regenerated their AI summary';
COMMENT ON COLUMN profiles.personality_ai_regenerations IS 'Count of times the user has regenerated their Personality AI analysis';
