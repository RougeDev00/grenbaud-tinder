-- ═══════════════════════════════════════════════════════════════════════
-- HOTFIX: Fix all RLS policies
--
-- ROOT CAUSE: profiles.id is auto-generated (uuid_generate_v4())
-- and is NOT equal to auth.uid(). The correct mapping is:
--   profiles.twitch_id = auth.uid()::text
--
-- For tables with user_id FK → profiles(id), the correct check is:
--   user_id = (SELECT id FROM profiles WHERE twitch_id = auth.uid()::text)
--
-- For messages (which use twitch_id directly as sender/receiver):
--   sender_id = auth.uid()::text
-- ═══════════════════════════════════════════════════════════════════════

-- Helper: get the current user's profile.id from auth
-- This avoids repeating the subquery everywhere
CREATE OR REPLACE FUNCTION my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE twitch_id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ╔═══════════════════════════════════════════════════════╗
-- ║  DROP ALL EXISTING POLICIES (clean slate)             ║
-- ╚═══════════════════════════════════════════════════════╝

-- profiles
DROP POLICY IF EXISTS "profiles_select_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_select_anon" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- messages
DROP POLICY IF EXISTS "messages_select_own" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;
DROP POLICY IF EXISTS "messages_update_received" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages with mutual analysis" ON messages;
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own received messages" ON messages;

-- notifications
DROP POLICY IF EXISTS "notifs_select_own" ON notifications;
DROP POLICY IF EXISTS "notifs_insert_auth" ON notifications;
DROP POLICY IF EXISTS "notifs_update_own" ON notifications;
DROP POLICY IF EXISTS "notifs_delete_own" ON notifications;
DROP POLICY IF EXISTS "Permit_Insert_All" ON notifications;
DROP POLICY IF EXISTS "Utenti vedono le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti aggiornano le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti cancellano le proprie notifiche" ON notifications;
DROP POLICY IF EXISTS "Utenti inseriscono notifiche" ON notifications;

-- compatibility_scores
DROP POLICY IF EXISTS "compat_select_auth" ON compatibility_scores;
DROP POLICY IF EXISTS "compat_insert_auth" ON compatibility_scores;
DROP POLICY IF EXISTS "Everyone can read compatibility scores" ON compatibility_scores;
DROP POLICY IF EXISTS "Authenticated users can insert scores" ON compatibility_scores;

-- events
DROP POLICY IF EXISTS "events_select_all" ON events;
DROP POLICY IF EXISTS "events_select_anon" ON events;
DROP POLICY IF EXISTS "events_insert_auth" ON events;
DROP POLICY IF EXISTS "events_update_creator" ON events;
DROP POLICY IF EXISTS "events_delete_creator" ON events;
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Creators can update their events." ON events;
DROP POLICY IF EXISTS "Creators can delete their events." ON events;

-- event_participants
DROP POLICY IF EXISTS "ep_select_auth" ON event_participants;
DROP POLICY IF EXISTS "ep_select_anon" ON event_participants;
DROP POLICY IF EXISTS "ep_insert_auth" ON event_participants;
DROP POLICY IF EXISTS "ep_update_creator" ON event_participants;
DROP POLICY IF EXISTS "ep_delete_self_or_creator" ON event_participants;
DROP POLICY IF EXISTS "Anyone can view participants" ON event_participants;
DROP POLICY IF EXISTS "Authenticated users can join events" ON event_participants;
DROP POLICY IF EXISTS "Users can cancel or creator can delete." ON event_participants;
DROP POLICY IF EXISTS "Creators can update participant status." ON event_participants;

-- event_messages
DROP POLICY IF EXISTS "em_select_auth" ON event_messages;
DROP POLICY IF EXISTS "em_insert_auth" ON event_messages;
DROP POLICY IF EXISTS "event_messages_select" ON event_messages;
DROP POLICY IF EXISTS "event_messages_insert" ON event_messages;

-- esplora_posts
DROP POLICY IF EXISTS "posts_select_auth" ON esplora_posts;
DROP POLICY IF EXISTS "posts_select_anon" ON esplora_posts;
DROP POLICY IF EXISTS "posts_insert_auth" ON esplora_posts;
DROP POLICY IF EXISTS "posts_update_own" ON esplora_posts;
DROP POLICY IF EXISTS "posts_delete_own" ON esplora_posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON esplora_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON esplora_posts;
DROP POLICY IF EXISTS "Owners can update own posts" ON esplora_posts;
DROP POLICY IF EXISTS "Anyone can update likes_count" ON esplora_posts;
DROP POLICY IF EXISTS "Owners can delete own posts" ON esplora_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON esplora_posts;

-- esplora_likes
DROP POLICY IF EXISTS "likes_select_auth" ON esplora_likes;
DROP POLICY IF EXISTS "likes_select_anon" ON esplora_likes;
DROP POLICY IF EXISTS "likes_insert_auth" ON esplora_likes;
DROP POLICY IF EXISTS "likes_delete_own" ON esplora_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON esplora_likes;
DROP POLICY IF EXISTS "Users can like posts" ON esplora_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON esplora_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON esplora_likes;

-- esplora_comments
DROP POLICY IF EXISTS "comments_select_auth" ON esplora_comments;
DROP POLICY IF EXISTS "comments_insert_auth" ON esplora_comments;
DROP POLICY IF EXISTS "comments_delete_own" ON esplora_comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON esplora_comments;
DROP POLICY IF EXISTS "Anyone can read comments" ON esplora_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON esplora_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON esplora_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON esplora_comments;

-- swipes
DROP POLICY IF EXISTS "swipes_select_own" ON swipes;
DROP POLICY IF EXISTS "swipes_insert_auth" ON swipes;
DROP POLICY IF EXISTS "Users can create their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can read their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can insert swipes" ON swipes;

-- matches
DROP POLICY IF EXISTS "matches_select_own" ON matches;
DROP POLICY IF EXISTS "matches_insert_auth" ON matches;
DROP POLICY IF EXISTS "Users can read their own matches" ON matches;
DROP POLICY IF EXISTS "System can create matches" ON matches;
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert matches" ON matches;

-- profile_views
DROP POLICY IF EXISTS "pv_select_auth" ON profile_views;
DROP POLICY IF EXISTS "pv_insert_auth" ON profile_views;

-- app_config
DROP POLICY IF EXISTS "config_select_all" ON app_config;
DROP POLICY IF EXISTS "config_select_anon" ON app_config;


-- ╔═══════════════════════════════════════════════════════╗
-- ║  CREATE CORRECT POLICIES                              ║
-- ╚═══════════════════════════════════════════════════════╝

-- ═══════════════════════
-- PROFILES
-- ═══════════════════════
CREATE POLICY "profiles_select_auth"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_select_anon"
  ON profiles FOR SELECT TO anon USING (is_registered = true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (twitch_id = auth.uid()::text);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (twitch_id = auth.uid()::text);

-- ═══════════════════════
-- MESSAGES (sender_id/receiver_id = twitch_id = auth.uid()::text)
-- ═══════════════════════
CREATE POLICY "messages_select_own"
  ON messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()::text
    OR receiver_id = auth.uid()::text
  );

CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "messages_update_received"
  ON messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid()::text);

-- ═══════════════════════
-- NOTIFICATIONS (user_id = profiles.id, NOT auth.uid())
-- ═══════════════════════
CREATE POLICY "notifs_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = my_profile_id());

CREATE POLICY "notifs_insert_auth"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notifs_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = my_profile_id());

CREATE POLICY "notifs_delete_own"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = my_profile_id() OR actor_id = my_profile_id());

-- ═══════════════════════
-- COMPATIBILITY_SCORES
-- ═══════════════════════
CREATE POLICY "compat_select_auth"
  ON compatibility_scores FOR SELECT TO authenticated USING (true);

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

CREATE POLICY "events_update_creator"
  ON events FOR UPDATE TO authenticated
  USING (creator_id = my_profile_id());

CREATE POLICY "events_delete_creator"
  ON events FOR DELETE TO authenticated
  USING (creator_id = my_profile_id() OR event_time < NOW());

-- ═══════════════════════
-- EVENT_PARTICIPANTS
-- ═══════════════════════
CREATE POLICY "ep_select_auth"
  ON event_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "ep_select_anon"
  ON event_participants FOR SELECT TO anon USING (true);

CREATE POLICY "ep_insert_auth"
  ON event_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = my_profile_id());

CREATE POLICY "ep_update_creator"
  ON event_participants FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_participants.event_id AND e.creator_id = my_profile_id())
  );

CREATE POLICY "ep_delete_self_or_creator"
  ON event_participants FOR DELETE TO authenticated
  USING (
    user_id = my_profile_id()
    OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_participants.event_id AND e.creator_id = my_profile_id())
  );

-- ═══════════════════════
-- EVENT_MESSAGES
-- ═══════════════════════
CREATE POLICY "em_select_auth"
  ON event_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_participants ep
      WHERE ep.event_id = event_messages.event_id
        AND ep.user_id = my_profile_id()
        AND ep.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_messages.event_id
        AND e.creator_id = my_profile_id()
    )
  );

CREATE POLICY "em_insert_auth"
  ON event_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = my_profile_id()
    AND (
      EXISTS (
        SELECT 1 FROM event_participants ep
        WHERE ep.event_id = event_messages.event_id
          AND ep.user_id = my_profile_id()
          AND ep.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_messages.event_id
          AND e.creator_id = my_profile_id()
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
  WITH CHECK (user_id = my_profile_id());

CREATE POLICY "posts_update_own"
  ON esplora_posts FOR UPDATE TO authenticated
  USING (user_id = my_profile_id());

CREATE POLICY "posts_delete_own"
  ON esplora_posts FOR DELETE TO authenticated
  USING (user_id = my_profile_id());

-- ═══════════════════════
-- ESPLORA_LIKES
-- ═══════════════════════
CREATE POLICY "likes_select_auth"
  ON esplora_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "likes_select_anon"
  ON esplora_likes FOR SELECT TO anon USING (true);

CREATE POLICY "likes_insert_auth"
  ON esplora_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = my_profile_id());

CREATE POLICY "likes_delete_own"
  ON esplora_likes FOR DELETE TO authenticated
  USING (user_id = my_profile_id());

-- ═══════════════════════
-- ESPLORA_COMMENTS
-- ═══════════════════════
CREATE POLICY "comments_select_auth"
  ON esplora_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "comments_insert_auth"
  ON esplora_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = my_profile_id());

CREATE POLICY "comments_delete_own"
  ON esplora_comments FOR DELETE TO authenticated
  USING (user_id = my_profile_id());

-- ═══════════════════════
-- SWIPES (swiper_id/swiped_id = profiles.id UUID)
-- ═══════════════════════
CREATE POLICY "swipes_select_own"
  ON swipes FOR SELECT TO authenticated
  USING (swiper_id = my_profile_id() OR swiped_id = my_profile_id());

CREATE POLICY "swipes_insert_auth"
  ON swipes FOR INSERT TO authenticated
  WITH CHECK (swiper_id = my_profile_id());

-- ═══════════════════════
-- MATCHES (user_1/user_2 = profiles.id UUID)
-- ═══════════════════════
CREATE POLICY "matches_select_own"
  ON matches FOR SELECT TO authenticated
  USING (user_1 = my_profile_id() OR user_2 = my_profile_id());

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
-- ║  FIX TRIGGER: comments_count SECURITY DEFINER        ║
-- ╚═══════════════════════════════════════════════════════╝

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
