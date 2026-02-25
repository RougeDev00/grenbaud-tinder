-- ═══════════════════════════════════════════════════
-- FIX: Notifications INSERT failing with RLS error
-- Solution: SECURITY DEFINER function bypasses RLS
-- ═══════════════════════════════════════════════════

-- 1. Nuclear option: drop ALL insert policies
DROP POLICY IF EXISTS "notifs_insert_auth" ON notifications;
DROP POLICY IF EXISTS "Utenti inseriscono notifiche" ON notifications;
DROP POLICY IF EXISTS "Permit_Insert_All" ON notifications;

-- 2. Recreate a truly permissive insert policy
CREATE POLICY "notifs_insert_auth"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Also create a SECURITY DEFINER function as backup
--    This bypasses RLS entirely for notification creation
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
    INSERT INTO notifications (user_id, type, actor_id, reference_id)
    VALUES (p_user_id, p_type, p_actor_id, p_reference_id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
