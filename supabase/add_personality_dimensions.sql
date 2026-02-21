-- Add columns for the 5 personality dimensions (PDF nomenclature: E/I, S/N, T/F, J/P, A/T)
-- Storing percentage scores (0-100) or raw scores. Let's store percentages for easier UI rendering.
-- Naming convention: personality_[dimension_name]

-- 1. Mind: Extraverted vs Introverted (score_mind)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_mind INT CHECK (personality_mind BETWEEN 0 AND 100);

-- 2. Energy: Intuitive vs Observant (S/N) (score_energy)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_energy INT CHECK (personality_energy BETWEEN 0 AND 100);

-- 3. Nature: Thinking vs Feeling (score_nature)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_nature INT CHECK (personality_nature BETWEEN 0 AND 100);

-- 4. Tactics: Judging vs Prospecting (score_tactics)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_tactics INT CHECK (personality_tactics BETWEEN 0 AND 100);

-- 5. Identity: Assertive vs Turbulent (score_identity)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_identity INT CHECK (personality_identity BETWEEN 0 AND 100);

COMMENT ON COLUMN profiles.personality_mind IS 'Extraverted vs Introverted percentage';
COMMENT ON COLUMN profiles.personality_energy IS 'Intuitive vs Observant percentage';
COMMENT ON COLUMN profiles.personality_nature IS 'Thinking vs Feeling percentage';
COMMENT ON COLUMN profiles.personality_tactics IS 'Judging vs Prospecting percentage';
COMMENT ON COLUMN profiles.personality_identity IS 'Assertive vs Turbulent percentage';
