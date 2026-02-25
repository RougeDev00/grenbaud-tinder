-- ═══════════════════════════════════════════════════
-- FIX: Likes persistence + Notifications
-- Problem: conflicting RLS policies from multiple migrations
-- Solution: drop all, recreate clean
-- ═══════════════════════════════════════════════════

-- Ensure my_profile_id() helper exists
CREATE OR REPLACE FUNCTION my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE twitch_id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════
-- ESPLORA_LIKES: clean slate
-- ═══════════════════════════════════════
ALTER TABLE esplora_likes ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "likes_select_auth" ON esplora_likes;
DROP POLICY IF EXISTS "likes_select_anon" ON esplora_likes;
DROP POLICY IF EXISTS "likes_insert_auth" ON esplora_likes;
DROP POLICY IF EXISTS "likes_delete_own" ON esplora_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON esplora_likes;
DROP POLICY IF EXISTS "Users can like posts" ON esplora_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON esplora_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON esplora_likes;

-- Recreate clean policies
-- SELECT: everyone can see likes (needed to compute hasLiked)
CREATE POLICY "likes_select_auth"
  ON esplora_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "likes_select_anon"
  ON esplora_likes FOR SELECT TO anon USING (true);

-- INSERT: toggle_esplora_like is SECURITY DEFINER so this is just a fallback
CREATE POLICY "likes_insert_auth"
  ON esplora_likes FOR INSERT TO authenticated
  WITH CHECK (true);

-- DELETE: toggle_esplora_like is SECURITY DEFINER so this is just a fallback
CREATE POLICY "likes_delete_own"
  ON esplora_likes FOR DELETE TO authenticated
  USING (true);

-- ═══════════════════════════════════════
-- NOTIFICATIONS: clean slate
-- ═══════════════════════════════════════
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifs_select_own" ON notifications;
DROP POLICY IF EXISTS "notifs_insert_auth" ON notifications;
DROP POLICY IF EXISTS "notifs_update_own" ON notifications;
DROP POLICY IF EXISTS "notifs_delete_own" ON notifications;
DROP POLICY IF EXISTS "Utenti vedono le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti aggiornano le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti cancellano le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti inseriscono notifiche" ON notifications;
DROP POLICY IF EXISTS "Permit_Insert_All" ON notifications;

-- SELECT: users see their own notifications
CREATE POLICY "notifs_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = my_profile_id());

-- INSERT: anyone authenticated can create notifications
CREATE POLICY "notifs_insert_auth"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: users can mark their own notifications as read
CREATE POLICY "notifs_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = my_profile_id());

-- DELETE: users can delete their own notifications
CREATE POLICY "notifs_delete_own"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = my_profile_id() OR actor_id = my_profile_id());

-- ═══════════════════════════════════════
-- GRANTS: ensure roles can access
-- ═══════════════════════════════════════
GRANT SELECT ON esplora_likes TO anon;
GRANT SELECT, INSERT, DELETE ON esplora_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- ═══════════════════════════════════════
-- Verify: test my_profile_id()
-- Run this to check if the function works for the current user:
-- SELECT my_profile_id();
-- If it returns NULL, the issue is that twitch_id doesn't match auth.uid()
-- ═══════════════════════════════════════
