ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS question_dream TEXT,
ADD COLUMN IF NOT EXISTS question_weekend TEXT,
ADD COLUMN IF NOT EXISTS question_redflag TEXT;
