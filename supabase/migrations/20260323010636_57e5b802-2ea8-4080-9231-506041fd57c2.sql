
-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a new update policy that prevents users from changing role, points, or invite_code
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND role = (SELECT p.role FROM profiles p WHERE p.user_id = auth.uid())
    AND points = (SELECT p.points FROM profiles p WHERE p.user_id = auth.uid())
    AND invite_code = (SELECT p.invite_code FROM profiles p WHERE p.user_id = auth.uid())
  );
