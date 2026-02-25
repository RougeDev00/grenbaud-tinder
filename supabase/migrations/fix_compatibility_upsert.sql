-- ═══════════════════════════════════════════════════════════════
-- HOTFIX: Add missing UPDATE + DELETE permissions for compatibility_scores
-- 
-- The security hardening script only granted SELECT, INSERT.
-- But upsert() needs UPDATE when a row already exists (conflict),
-- and admin_delete_scores needs DELETE.
--
-- Also adds missing DELETE policy that was in the per_user migration.
-- ═══════════════════════════════════════════════════════════════

-- 1. Add missing GRANT
GRANT UPDATE, DELETE ON compatibility_scores TO authenticated;

-- 2. Add UPDATE policy (needed for upsert)
DROP POLICY IF EXISTS "compat_update_auth" ON compatibility_scores;
CREATE POLICY "compat_update_auth"
  ON compatibility_scores FOR UPDATE TO authenticated
  USING (true);

-- 3. Re-add DELETE policy (was in per_user_compatibility migration)
DROP POLICY IF EXISTS "Admin can delete scores" ON compatibility_scores;
DROP POLICY IF EXISTS "compat_delete_auth" ON compatibility_scores;
CREATE POLICY "compat_delete_auth"
  ON compatibility_scores FOR DELETE TO authenticated
  USING (true);

-- 4. Also ensure the unique_generation constraint exists
-- (if the migration wasn't run, this will create it)
ALTER TABLE compatibility_scores ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE compatibility_scores DROP CONSTRAINT IF EXISTS unique_pair;
ALTER TABLE compatibility_scores DROP CONSTRAINT IF EXISTS users_ordered;

-- Only add if it doesn't exist (will error if already exists, so we use DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_generation'
    ) THEN
        ALTER TABLE compatibility_scores ADD CONSTRAINT unique_generation UNIQUE(generated_by, user_a, user_b);
    END IF;
END $$;
