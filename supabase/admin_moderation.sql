-- 1. Add moderation columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warning_message TEXT;

-- 2. Secure RPC to fetch all profiles for admin dashboard
CREATE OR REPLACE FUNCTION admin_get_profiles(admin_password TEXT)
RETURNS SETOF profiles AS $$
BEGIN
  IF admin_password = 'skimingow' THEN
    RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Secure RPC to ban a user
CREATE OR REPLACE FUNCTION admin_ban_user(target_id UUID, reason TEXT, admin_password TEXT)
RETURNS void AS $$
BEGIN
  IF admin_password = 'skimingow' THEN
    UPDATE profiles SET is_banned = true, ban_reason = reason WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure RPC to unban a user
CREATE OR REPLACE FUNCTION admin_unban_user(target_id UUID, admin_password TEXT)
RETURNS void AS $$
BEGIN
  IF admin_password = 'skimingow' THEN
    UPDATE profiles SET is_banned = false, ban_reason = null WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Secure RPC to warn a user
CREATE OR REPLACE FUNCTION admin_warn_user(target_id UUID, msg TEXT, admin_password TEXT)
RETURNS void AS $$
BEGIN
  IF admin_password = 'skimingow' THEN
    UPDATE profiles SET warning_message = msg WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC for users to acknowledge and clear their own warning
CREATE OR REPLACE FUNCTION acknowledge_warning()
RETURNS void AS $$
BEGIN
  -- Assuming auth.jwt()->>'sub' gives the twitch_id
  UPDATE profiles 
  SET warning_message = null 
  WHERE twitch_id = auth.jwt() ->> 'sub';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Secure RPC to permanently delete a user
CREATE OR REPLACE FUNCTION admin_delete_user(target_id UUID, admin_password TEXT)
RETURNS void AS $$
BEGIN
  IF admin_password = 'skimingow' THEN
    DELETE FROM profiles WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
