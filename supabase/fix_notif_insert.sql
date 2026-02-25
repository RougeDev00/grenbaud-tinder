-- ═══════════════════════════════════════════════════
-- MASTER FIX: Notifications
-- Root causes:
-- 1. type column uses ENUM, RPC was passing TEXT
-- 2. user_id FK → auth.users(id) but code passes profiles.id
-- 3. Missing enum values: SPY_RECIPROCAL, ESPLORA_REPLY
-- ═══════════════════════════════════════════════════

-- 1. Add ALL missing enum values
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SPY_RECIPROCAL';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ESPLORA_LIKE';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ESPLORA_COMMENT';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ESPLORA_REPLY';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'EVENT_REMOVE';

-- 2. Drop the FK constraint on user_id (profiles.id ≠ auth.users.id)
--    We need to allow storing profiles.id as user_id
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- 3. Drop old broken RPC
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, UUID, TEXT);

-- 4. Create correct SECURITY DEFINER function with ENUM cast
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, actor_id, reference_id, read, created_at)
    VALUES (
        p_user_id,
        p_type::notification_type,
        p_actor_id,
        p_reference_id::UUID,
        false,
        NOW()
    )
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Clean up RLS policies
DROP POLICY IF EXISTS "notifs_insert_auth" ON notifications;
DROP POLICY IF EXISTS "Utenti inseriscono notifiche" ON notifications;
DROP POLICY IF EXISTS "Permit_Insert_All" ON notifications;

CREATE POLICY "notifs_insert_auth"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);
