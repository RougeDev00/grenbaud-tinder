-- Function to get profiles to swipe for a specific user
-- Excludes profiles already swiped by the user
-- Excludes the user themselves
-- Only includes registered users
CREATE OR REPLACE FUNCTION get_profiles_to_swipe(querying_user_id UUID)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM profiles
  WHERE id != querying_user_id
    AND is_registered = true
    AND id NOT IN (
      SELECT swiped_id
      FROM swipes
      WHERE swiper_id = querying_user_id
    )
  ORDER BY created_at DESC
  LIMIT 50;
$$;
