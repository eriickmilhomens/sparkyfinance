CREATE OR REPLACE FUNCTION public.update_user_points(_user_id uuid, _points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles SET points = _points WHERE user_id = _user_id;
END;
$$;