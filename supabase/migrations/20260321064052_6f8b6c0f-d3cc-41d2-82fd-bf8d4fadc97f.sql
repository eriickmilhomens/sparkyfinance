
-- Step 1: Create a SECURITY DEFINER function to get the user's group_code without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_group_code(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_code FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Step 2: Drop the old recursive SELECT policy
DROP POLICY IF EXISTS "Users can read own and group profiles" ON public.profiles;

-- Step 3: Create a new non-recursive SELECT policy
CREATE POLICY "Users can read own and group profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    group_code IS NOT NULL
    AND group_code = public.get_user_group_code(auth.uid())
  )
);
