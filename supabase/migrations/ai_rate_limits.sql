-- ═══════════════════════════════════════════════════════════════
-- Rate Limiting Table for AI Edge Function
-- Tracks daily AI call count per user, persisted in DB
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_rate_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_count INT DEFAULT 0,
    last_reset DATE DEFAULT CURRENT_DATE,
    minute_count INT DEFAULT 0,
    minute_reset TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only the service role (Edge Function) can read/write
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public/authenticated access — only service_role can touch this table
-- (Edge Functions use service_role by default when using SUPABASE_SERVICE_ROLE_KEY)

-- Function: increment and check rate limit (atomic, no race conditions)
-- Returns: 'ok' if allowed, 'daily_limit' or 'minute_limit' if blocked
CREATE OR REPLACE FUNCTION check_ai_rate_limit(
    p_user_id UUID,
    p_daily_max INT DEFAULT 1000,
    p_minute_max INT DEFAULT 10
)
RETURNS TEXT AS $$
DECLARE
    v_daily_count INT;
    v_last_reset DATE;
    v_minute_count INT;
    v_minute_reset TIMESTAMPTZ;
BEGIN
    -- Upsert: create row if not exists
    INSERT INTO ai_rate_limits (user_id, daily_count, last_reset, minute_count, minute_reset)
    VALUES (p_user_id, 0, CURRENT_DATE, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Get current state (with row lock to prevent race conditions)
    SELECT daily_count, last_reset, minute_count, minute_reset
    INTO v_daily_count, v_last_reset, v_minute_count, v_minute_reset
    FROM ai_rate_limits
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Reset daily counter if it's a new day
    IF v_last_reset < CURRENT_DATE THEN
        v_daily_count := 0;
        v_last_reset := CURRENT_DATE;
    END IF;

    -- Reset minute counter if more than 60 seconds passed
    IF NOW() - v_minute_reset > INTERVAL '60 seconds' THEN
        v_minute_count := 0;
        v_minute_reset := NOW();
    END IF;

    -- Check daily limit
    IF v_daily_count >= p_daily_max THEN
        UPDATE ai_rate_limits
        SET daily_count = v_daily_count, last_reset = v_last_reset,
            minute_count = v_minute_count, minute_reset = v_minute_reset
        WHERE user_id = p_user_id;
        RETURN 'daily_limit';
    END IF;

    -- Check per-minute limit
    IF v_minute_count >= p_minute_max THEN
        UPDATE ai_rate_limits
        SET daily_count = v_daily_count, last_reset = v_last_reset,
            minute_count = v_minute_count, minute_reset = v_minute_reset
        WHERE user_id = p_user_id;
        RETURN 'minute_limit';
    END IF;

    -- Allowed — increment both counters
    UPDATE ai_rate_limits
    SET daily_count = v_daily_count + 1,
        last_reset = v_last_reset,
        minute_count = v_minute_count + 1,
        minute_reset = v_minute_reset
    WHERE user_id = p_user_id;

    RETURN 'ok';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
