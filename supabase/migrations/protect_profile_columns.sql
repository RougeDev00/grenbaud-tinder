-- ═══════════════════════════════════════════════════════════════
-- PROTECT PROFILE COLUMNS FROM USER MODIFICATION
--
-- Users can update their own profile, but they MUST NOT be able
-- to change identity fields or admin fields via direct API calls.
-- This trigger silently reverts any attempt to modify protected columns.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION protect_profile_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Identity fields: ALWAYS revert to original values (nobody can change these)
    NEW.id := OLD.id;
    NEW.twitch_id := OLD.twitch_id;
    NEW.twitch_username := OLD.twitch_username;
    NEW.created_at := OLD.created_at;

    -- Admin/moderation fields: only allow changes when called from
    -- SECURITY DEFINER functions (admin RPCs) which run as 'postgres' user.
    -- Normal REST API calls run as 'authenticator' role.
    IF current_user != 'postgres' THEN
        NEW.is_banned := OLD.is_banned;
        NEW.ban_reason := OLD.ban_reason;
        NEW.warning_message := OLD.warning_message;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS trg_protect_profile_columns ON profiles;
CREATE TRIGGER trg_protect_profile_columns
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_profile_columns();
