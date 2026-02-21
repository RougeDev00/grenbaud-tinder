-- Add personality_type column to profiles table (MBTI type, e.g., 'INFP')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_type VARCHAR(4) CHECK (personality_type ~ '^[I|E][S|N][T|F][J|P]$');

-- Comment for documentation
COMMENT ON COLUMN profiles.personality_type IS 'MBTI personality type (e.g., ENTJ, ISFP, etc.)';
