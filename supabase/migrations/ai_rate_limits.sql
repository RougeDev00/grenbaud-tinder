-- ═══════════════════════════════════════════════════════════════
-- Rate Limiting Table for AI Edge Function
-- Tracks daily AI call count per user, persisted in DB
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_rate_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_count INT DEFAULT 0,
    last_reset DATE DEFAULT CURRENT_DATE
);

-- RLS: only the service role (Edge Function) can read/write
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public/authenticated access — only service_role can touch this table
-- (Edge Functions use service_role by default when using SUPABASE_SERVICE_ROLE_KEY)

-- Function: increment and check rate limit (atomic, no race conditions)
CREATE OR REPLACE FUNCTION check_ai_rate_limit(p_user_id UUID, p_daily_max INT DEFAULT 1000)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
    v_last_reset DATE;
BEGIN
    -- Upsert: create row if not exists
    INSERT INTO ai_rate_limits (user_id, daily_count, last_reset)
    VALUES (p_user_id, 0, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;

    -- Get current state (with row lock to prevent race conditions)
    SELECT daily_count, last_reset INTO v_count, v_last_reset
    FROM ai_rate_limits
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Reset counter if it's a new day
    IF v_last_reset < CURRENT_DATE THEN
        UPDATE ai_rate_limits
        SET daily_count = 1, last_reset = CURRENT_DATE
        WHERE user_id = p_user_id;
        RETURN TRUE; -- allowed (first call of the day)
    END IF;

    -- Check limit
    IF v_count >= p_daily_max THEN
        RETURN FALSE; -- blocked
    END IF;

    -- Increment counter
    UPDATE ai_rate_limits
    SET daily_count = daily_count + 1
    WHERE user_id = p_user_id;

    RETURN TRUE; -- allowed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
