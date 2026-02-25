-- ═══════════════════════════════════════════════════════════════
-- FIX: Enforce mutual compatibility analysis before sending messages
--
-- The old policy only checked sender_id = authenticated user.
-- The new policy ALSO requires that BOTH users have generated a
-- compatibility score (i.e. mutual analysis exists). This prevents
-- anyone from bypassing the client-side chat lock via direct API calls.
-- ═══════════════════════════════════════════════════════════════

-- 1. Drop the old permissive INSERT policy
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- 2. Create a new INSERT policy with mutual analysis check
CREATE POLICY "Users can send messages with mutual analysis"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be the actual authenticated user
    sender_id = (SELECT twitch_id FROM profiles WHERE id = auth.uid())
    AND
    -- Must have mutual compatibility analysis (both users generated a score)
    EXISTS (
      SELECT 1
      FROM compatibility_scores cs1
      JOIN compatibility_scores cs2 ON cs1.user_a = cs2.user_a AND cs1.user_b = cs2.user_b
      WHERE
        -- Match the pair (user_a is always the "smaller" UUID)
        cs1.user_a = LEAST(
          (SELECT id FROM profiles WHERE twitch_id = sender_id),
          (SELECT id FROM profiles WHERE twitch_id = receiver_id)
        )
        AND cs1.user_b = GREATEST(
          (SELECT id FROM profiles WHERE twitch_id = sender_id),
          (SELECT id FROM profiles WHERE twitch_id = receiver_id)
        )
        -- User 1 generated
        AND cs1.generated_by = (SELECT id FROM profiles WHERE twitch_id = sender_id)
        -- User 2 generated
        AND cs2.generated_by = (SELECT id FROM profiles WHERE twitch_id = receiver_id)
    )
  );
