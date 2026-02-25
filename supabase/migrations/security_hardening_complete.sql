-- ═══════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING: Complete RLS & Grants Lockdown
-- 
-- WHAT THIS FIXES:
--   1. Removes `GRANT ALL ... TO anon` (the root cause — anon had full access)
--   2. Restricts `authenticated` grants to only necessary operations
--   3. Fixes notifications policies (were fully open via USING(true))
--   4. Ensures messages SELECT only returns user's own messages
--   5. Keeps all existing functionality working
--
-- HOW TO RUN:
--   Copy-paste the ENTIRE script into Supabase → SQL Editor → Run
--
-- ROLLBACK:
--   If something breaks, run: GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
--   That re-opens everything for auth users (still safer than anon had before)
-- ═══════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════╗
-- ║  PHASE 1: REVOKE ALL GRANTS — START CLEAN            ║
-- ╚═══════════════════════════════════════════════════════╝

-- Remove ALL permissions from anon (public/unauthenticated)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Remove ALL permissions from authenticated (we'll re-add selectively)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

-- Ensure both can use the schema itself
GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- Sequences are needed for auto-increment IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ╔═══════════════════════════════════════════════════════╗
-- ║  PHASE 2: TABLE-LEVEL GRANTS (minimum required)      ║
-- ╚═══════════════════════════════════════════════════════╝

-- ── profiles ──
-- anon needs SELECT for the landing page (public profiles)
GRANT SELECT ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
-- DELETE only via specific RLS

-- ── messages ──
-- No anon access at all
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- ── notifications ──
-- No anon access
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- ── compatibility_scores ──
-- No anon access
GRANT SELECT, INSERT ON compatibility_scores TO authenticated;

-- ── events ──
-- anon can see events on landing
GRANT SELECT ON events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;

-- ── event_participants ──
GRANT SELECT ON event_participants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_participants TO authenticated;

-- ── event_messages ──
GRANT SELECT, INSERT ON event_messages TO authenticated;

-- ── esplora_posts ──
GRANT SELECT ON esplora_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON esplora_posts TO authenticated;

-- ── esplora_likes ──
GRANT SELECT ON esplora_likes TO anon;
GRANT SELECT, INSERT, DELETE ON esplora_likes TO authenticated;

-- ── esplora_comments ──
GRANT SELECT, INSERT, DELETE ON esplora_comments TO authenticated;

-- ── swipes ──
GRANT SELECT, INSERT ON swipes TO authenticated;

-- ── matches ──
GRANT SELECT, INSERT ON matches TO authenticated;

-- ── profile_views ──
GRANT SELECT, INSERT ON profile_views TO authenticated;

-- ── app_config ──
GRANT SELECT ON app_config TO anon;
GRANT SELECT ON app_config TO authenticated;


-- ╔═══════════════════════════════════════════════════════╗
-- ║  PHASE 3: RLS ENABLED ON ALL TABLES                  ║
-- ╚═══════════════════════════════════════════════════════╝

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE esplora_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE esplora_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE esplora_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;


-- ╔═══════════════════════════════════════════════════════╗
-- ║  PHASE 4: DROP ALL OLD POLICIES (clean slate)        ║
-- ╚═══════════════════════════════════════════════════════╝

-- profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile deletion" ON profiles;

-- messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages with mutual analysis" ON messages;
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own received messages" ON messages;

-- notifications
DROP POLICY IF EXISTS "Permit_Insert_All" ON notifications;
DROP POLICY IF EXISTS "Utenti vedono le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti aggiornano le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti cancellano le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti inseriscono notifiche" ON notifications;

-- compatibility_scores
DROP POLICY IF EXISTS "Everyone can read compatibility scores" ON compatibility_scores;
DROP POLICY IF EXISTS "Authenticated users can insert scores" ON compatibility_scores;

-- events
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Creators can update their events." ON events;
DROP POLICY IF EXISTS "Creators can delete their events." ON events;

-- event_participants
DROP POLICY IF EXISTS "Anyone can view participants" ON event_participants;
DROP POLICY IF EXISTS "Authenticated users can join events" ON event_participants;
DROP POLICY IF EXISTS "Users can cancel or creator can delete." ON event_participants;
DROP POLICY IF EXISTS "Creators can update participant status." ON event_participants;

-- esplora
DROP POLICY IF EXISTS "Anyone can view posts" ON esplora_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON esplora_posts;
DROP POLICY IF EXISTS "Owners can update own posts" ON esplora_posts;
DROP POLICY IF EXISTS "Anyone can update likes_count" ON esplora_posts;
DROP POLICY IF EXISTS "Owners can delete own posts" ON esplora_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON esplora_posts;
DROP POLICY IF EXISTS "Anyone can view likes" ON esplora_likes;
DROP POLICY IF EXISTS "Users can like posts" ON esplora_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON esplora_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON esplora_likes;
DROP POLICY IF EXISTS "Anyone can view comments" ON esplora_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON esplora_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON esplora_comments;

-- swipes & matches
DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can insert swipes" ON swipes;
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert matches" ON matches;

-- profile_views
DROP POLICY IF EXISTS "Anyone can view profile_views" ON profile_views;
DROP POLICY IF EXISTS "Authenticated can insert profile_views" ON profile_views;

-- app_config
DROP POLICY IF EXISTS "Anyone can read app_config" ON app_config;

-- event_messages
DROP POLICY IF EXISTS "Anyone can view event messages" ON event_messages;
DROP POLICY IF EXISTS "Authenticated users can send event messages" ON event_messages;
DROP POLICY IF EXISTS "event_messages_select" ON event_messages;
DROP POLICY IF EXISTS "event_messages_insert" ON event_messages;

-- Also drop the original schema.sql policy names
DROP POLICY IF EXISTS "Users can create their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can read their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can read their own matches" ON matches;
DROP POLICY IF EXISTS "System can create matches" ON matches;
DROP POLICY IF EXISTS "Anyone can read comments" ON esplora_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON esplora_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON esplora_comments;

-- Drop new names too (idempotent — safe to re-run this script)
DROP POLICY IF EXISTS "profiles_select_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_select_anon" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "messages_select_own" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;
DROP POLICY IF EXISTS "messages_update_received" ON messages;
DROP POLICY IF EXISTS "notifs_select_own" ON notifications;
DROP POLICY IF EXISTS "notifs_insert_auth" ON notifications;
DROP POLICY IF EXISTS "notifs_update_own" ON notifications;
DROP POLICY IF EXISTS "notifs_delete_own" ON notifications;
DROP POLICY IF EXISTS "compat_select_auth" ON compatibility_scores;
DROP POLICY IF EXISTS "compat_insert_auth" ON compatibility_scores;
DROP POLICY IF EXISTS "events_select_all" ON events;
DROP POLICY IF EXISTS "events_select_anon" ON events;
DROP POLICY IF EXISTS "events_insert_auth" ON events;
DROP POLICY IF EXISTS "events_update_creator" ON events;
DROP POLICY IF EXISTS "events_delete_creator" ON events;
DROP POLICY IF EXISTS "ep_select_auth" ON event_participants;
DROP POLICY IF EXISTS "ep_select_anon" ON event_participants;
DROP POLICY IF EXISTS "ep_insert_auth" ON event_participants;
DROP POLICY IF EXISTS "ep_update_creator" ON event_participants;
DROP POLICY IF EXISTS "ep_delete_self_or_creator" ON event_participants;
DROP POLICY IF EXISTS "em_select_auth" ON event_messages;
DROP POLICY IF EXISTS "em_insert_auth" ON event_messages;
DROP POLICY IF EXISTS "posts_select_auth" ON esplora_posts;
DROP POLICY IF EXISTS "posts_select_anon" ON esplora_posts;
DROP POLICY IF EXISTS "posts_insert_auth" ON esplora_posts;
DROP POLICY IF EXISTS "posts_update_own" ON esplora_posts;
DROP POLICY IF EXISTS "posts_delete_own" ON esplora_posts;
DROP POLICY IF EXISTS "likes_select_auth" ON esplora_likes;
DROP POLICY IF EXISTS "likes_select_anon" ON esplora_likes;
DROP POLICY IF EXISTS "likes_insert_auth" ON esplora_likes;
DROP POLICY IF EXISTS "likes_delete_own" ON esplora_likes;
DROP POLICY IF EXISTS "comments_select_auth" ON esplora_comments;
DROP POLICY IF EXISTS "comments_insert_auth" ON esplora_comments;
DROP POLICY IF EXISTS "comments_delete_own" ON esplora_comments;
DROP POLICY IF EXISTS "swipes_select_own" ON swipes;
DROP POLICY IF EXISTS "swipes_insert_auth" ON swipes;
DROP POLICY IF EXISTS "matches_select_own" ON matches;
DROP POLICY IF EXISTS "matches_insert_auth" ON matches;
DROP POLICY IF EXISTS "pv_select_auth" ON profile_views;
DROP POLICY IF EXISTS "pv_insert_auth" ON profile_views;
DROP POLICY IF EXISTS "config_select_all" ON app_config;
DROP POLICY IF EXISTS "config_select_anon" ON app_config;


-- ╔═══════════════════════════════════════════════════════╗
-- ║  PHASE 5: CREATE NEW SECURE POLICIES                 ║
-- ╚═══════════════════════════════════════════════════════╝

-- ═══════════════════════
-- PROFILES
-- ═══════════════════════
-- Any authenticated user can see all profiles (needed for grid, search)
CREATE POLICY "profiles_select_auth"
  ON profiles FOR SELECT TO authenticated USING (true);

-- Anon can also see profiles (landing page)
CREATE POLICY "profiles_select_anon"
  ON profiles FOR SELECT TO anon USING (is_registered = true);

-- Users can only insert their OWN profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR twitch_id = auth.uid()::text);

-- Users can only update their OWN profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ═══════════════════════
-- MESSAGES (CRITICAL)
-- ═══════════════════════
-- Users can ONLY read messages where they are sender OR receiver
CREATE POLICY "messages_select_own"
  ON messages FOR SELECT TO authenticated
  USING (
    sender_id = (SELECT twitch_id FROM profiles WHERE id = auth.uid())
    OR
    receiver_id = (SELECT twitch_id FROM profiles WHERE id = auth.uid())
  );

-- Users can only send messages AS themselves
CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT twitch_id FROM profiles WHERE id = auth.uid())
  );

-- Users can update messages sent TO them (mark as read)
CREATE POLICY "messages_update_received"
  ON messages FOR UPDATE TO authenticated
  USING (
    receiver_id = (SELECT twitch_id FROM profiles WHERE id = auth.uid())
  );

-- ═══════════════════════
-- NOTIFICATIONS
-- ═══════════════════════
-- Users see ONLY their own notifications
CREATE POLICY "notifs_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Any authenticated user can INSERT notifications (to notify other users)
CREATE POLICY "notifs_insert_auth"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can UPDATE only their own notifications (mark read)
CREATE POLICY "notifs_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can DELETE only their own notifications
-- OR notifications where they are the actor (for spy cleanup)
CREATE POLICY "notifs_delete_own"
  ON notifications FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR actor_id = auth.uid()
  );

-- ═══════════════════════
-- COMPATIBILITY_SCORES
-- ═══════════════════════
-- All authenticated can read (needed for profile cards)
CREATE POLICY "compat_select_auth"
  ON compatibility_scores FOR SELECT TO authenticated USING (true);

-- Authenticated can insert scores
CREATE POLICY "compat_insert_auth"
  ON compatibility_scores FOR INSERT TO authenticated
  WITH CHECK (true);

-- ═══════════════════════
-- EVENTS
-- ═══════════════════════
CREATE POLICY "events_select_all"
  ON events FOR SELECT TO authenticated USING (true);

CREATE POLICY "events_select_anon"
  ON events FOR SELECT TO anon USING (true);

CREATE POLICY "events_insert_auth"
  ON events FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only creator can update
CREATE POLICY "events_update_creator"
  ON events FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = events.creator_id AND p.id = auth.uid()
    )
  );

-- Creator can delete own events + anyone can cleanup expired
CREATE POLICY "events_delete_creator"
  ON events FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = events.creator_id AND p.id = auth.uid()
    )
    OR event_time < NOW()
  );

-- ═══════════════════════
-- EVENT_PARTICIPANTS
-- ═══════════════════════
CREATE POLICY "ep_select_auth"
  ON event_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "ep_select_anon"
  ON event_participants FOR SELECT TO anon USING (true);

CREATE POLICY "ep_insert_auth"
  ON event_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Creator can accept/reject participants
CREATE POLICY "ep_update_creator"
  ON event_participants FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e WHERE e.id = event_participants.event_id AND e.creator_id = auth.uid()
    )
  );

-- User can remove self OR creator can remove anyone
CREATE POLICY "ep_delete_self_or_creator"
  ON event_participants FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM events e WHERE e.id = event_participants.event_id AND e.creator_id = auth.uid()
    )
  );

-- ═══════════════════════
-- EVENT_MESSAGES (already has proper policies from event_chat.sql)
-- Only re-create if they were dropped above
-- ═══════════════════════
CREATE POLICY "em_select_auth"
  ON event_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_participants ep
      WHERE ep.event_id = event_messages.event_id
        AND ep.user_id = auth.uid()
        AND ep.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_messages.event_id
        AND e.creator_id = auth.uid()
    )
  );

CREATE POLICY "em_insert_auth"
  ON event_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM event_participants ep
        WHERE ep.event_id = event_messages.event_id
          AND ep.user_id = auth.uid()
          AND ep.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_messages.event_id
          AND e.creator_id = auth.uid()
      )
    )
  );

-- ═══════════════════════
-- ESPLORA_POSTS
-- ═══════════════════════
CREATE POLICY "posts_select_auth"
  ON esplora_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "posts_select_anon"
  ON esplora_posts FOR SELECT TO anon USING (true);

CREATE POLICY "posts_insert_auth"
  ON esplora_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner can update own posts
-- NOTE: likes_count is updated by a SECURITY DEFINER trigger, which bypasses RLS
CREATE POLICY "posts_update_own"
  ON esplora_posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "posts_delete_own"
  ON esplora_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ═══════════════════════
-- ESPLORA_LIKES
-- ═══════════════════════
CREATE POLICY "likes_select_auth"
  ON esplora_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "likes_select_anon"
  ON esplora_likes FOR SELECT TO anon USING (true);

CREATE POLICY "likes_insert_auth"
  ON esplora_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "likes_delete_own"
  ON esplora_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ═══════════════════════
-- ESPLORA_COMMENTS
-- ═══════════════════════
CREATE POLICY "comments_select_auth"
  ON esplora_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "comments_insert_auth"
  ON esplora_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner can delete own comments
CREATE POLICY "comments_delete_own"
  ON esplora_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ═══════════════════════
-- SWIPES (uses UUID profiles.id, NOT twitch_id)
-- ═══════════════════════
-- Users can only see their own swipes
CREATE POLICY "swipes_select_own"
  ON swipes FOR SELECT TO authenticated
  USING (
    swiper_id = auth.uid()
    OR swiped_id = auth.uid()
  );

CREATE POLICY "swipes_insert_auth"
  ON swipes FOR INSERT TO authenticated
  WITH CHECK (swiper_id = auth.uid());

-- ═══════════════════════
-- MATCHES (uses UUID profiles.id as user_1/user_2)
-- ═══════════════════════
CREATE POLICY "matches_select_own"
  ON matches FOR SELECT TO authenticated
  USING (
    user_1 = auth.uid()
    OR user_2 = auth.uid()
  );

CREATE POLICY "matches_insert_auth"
  ON matches FOR INSERT TO authenticated
  WITH CHECK (true);

-- ═══════════════════════
-- PROFILE_VIEWS
-- ═══════════════════════
CREATE POLICY "pv_select_auth"
  ON profile_views FOR SELECT TO authenticated USING (true);

CREATE POLICY "pv_insert_auth"
  ON profile_views FOR INSERT TO authenticated
  WITH CHECK (true);

-- ═══════════════════════
-- APP_CONFIG
-- ═══════════════════════
CREATE POLICY "config_select_all"
  ON app_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "config_select_anon"
  ON app_config FOR SELECT TO anon USING (true);


-- ╔═══════════════════════════════════════════════════════╗
-- ║  PHASE 6: FIX TRIGGER FUNCTIONS                      ║
-- ╚═══════════════════════════════════════════════════════╝

-- The comments_count trigger updates esplora_posts when someone else comments.
-- With our new restrictive policy (only owner can update), this would fail.
-- Solution: make it SECURITY DEFINER so it bypasses RLS.
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE esplora_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE esplora_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ╔═══════════════════════════════════════════════════════╗
-- ║  PHASE 7: VERIFY                                     ║
-- ╚═══════════════════════════════════════════════════════╝

-- Verify RLS is active on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Verify anon has minimal access:
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE grantee = 'anon' AND table_schema = 'public';
