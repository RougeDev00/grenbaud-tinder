-- Policy to allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (twitch_id = auth.jwt() ->> 'sub');
