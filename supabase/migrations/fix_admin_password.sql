-- =============================================
-- Migration: Replace hardcoded admin password with secure config table
-- 
-- After running this, change the password with:
--   UPDATE app_config SET value = 'LA_TUA_NUOVA_PASSWORD' WHERE key = 'admin_password';
-- =============================================

-- 1. Create a config table (only readable by SECURITY DEFINER functions)
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert the admin password (CHANGE THIS after running!)
INSERT INTO app_config (key, value) VALUES ('admin_password', 'CAMBIAMI_SUBITO')
ON CONFLICT (key) DO NOTHING;

-- Lock down: NO ONE can read this table directly (only SECURITY DEFINER functions)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies = no one can SELECT/INSERT/UPDATE/DELETE via the API
-- Only SECURITY DEFINER functions (running as postgres) can access it

-- Revoke direct access from anon and authenticated roles
REVOKE ALL ON app_config FROM anon, authenticated;

-- Helper function to read config (SECURITY DEFINER = runs as owner/postgres)
CREATE OR REPLACE FUNCTION get_app_config(config_key TEXT)
RETURNS TEXT AS $$
  SELECT value FROM app_config WHERE key = config_key;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- 1. admin_get_profiles
-- =============================================
CREATE OR REPLACE FUNCTION admin_get_profiles(admin_password TEXT)
RETURNS SETOF profiles AS $$
BEGIN
  IF admin_password = get_app_config('admin_password') AND admin_password != '' THEN
    RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. admin_ban_user
-- =============================================
CREATE OR REPLACE FUNCTION admin_ban_user(target_id UUID, reason TEXT, admin_password TEXT)
RETURNS void AS $$
BEGIN
  IF admin_password = get_app_config('admin_password') AND admin_password != '' THEN
    UPDATE profiles SET is_banned = true, ban_reason = reason WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. admin_unban_user
-- =============================================
CREATE OR REPLACE FUNCTION admin_unban_user(target_id UUID, admin_password TEXT)
RETURNS void AS $$
BEGIN
  IF admin_password = get_app_config('admin_password') AND admin_password != '' THEN
    UPDATE profiles SET is_banned = false, ban_reason = null WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. admin_warn_user
-- =============================================
CREATE OR REPLACE FUNCTION admin_warn_user(target_id UUID, msg TEXT, admin_password TEXT)
RETURNS void AS $$
BEGIN
  IF admin_password = get_app_config('admin_password') AND admin_password != '' THEN
    UPDATE profiles SET warning_message = msg WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. admin_delete_user
-- =============================================
CREATE OR REPLACE FUNCTION admin_delete_user(target_id UUID, admin_password TEXT)
RETURNS void AS $$
BEGIN
  IF admin_password = get_app_config('admin_password') AND admin_password != '' THEN
    DELETE FROM profiles WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. admin_get_user_scores
-- =============================================
DROP FUNCTION IF EXISTS admin_get_user_scores(UUID, TEXT);
CREATE OR REPLACE FUNCTION admin_get_user_scores(target_id UUID, admin_password TEXT)
RETURNS TABLE (
    score_id UUID,
    other_user_id UUID,
    other_display_name TEXT,
    other_twitch_username TEXT,
    other_avatar TEXT,
    generated_by_id UUID,
    generated_by_name TEXT,
    score INT,
    explanation TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF admin_password = get_app_config('admin_password') AND admin_password != '' THEN
        RETURN QUERY
        SELECT
            cs.id AS score_id,
            CASE WHEN cs.user_a = target_id THEN cs.user_b ELSE cs.user_a END AS other_user_id,
            p.display_name AS other_display_name,
            p.twitch_username AS other_twitch_username,
            p.avatar_url AS other_avatar,
            cs.generated_by AS generated_by_id,
            g.display_name AS generated_by_name,
            cs.score,
            cs.explanation,
            cs.created_at
        FROM compatibility_scores cs
        JOIN profiles p ON p.id = CASE WHEN cs.user_a = target_id THEN cs.user_b ELSE cs.user_a END
        JOIN profiles g ON g.id = cs.generated_by
        WHERE cs.user_a = target_id OR cs.user_b = target_id
        ORDER BY cs.created_at DESC;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. admin_delete_score
-- =============================================
CREATE OR REPLACE FUNCTION admin_delete_score(score_id UUID, admin_password TEXT)
RETURNS void AS $$
BEGIN
    IF admin_password = get_app_config('admin_password') AND admin_password != '' THEN
        DELETE FROM compatibility_scores WHERE id = score_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
