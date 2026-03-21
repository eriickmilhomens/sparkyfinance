
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  invite_code text NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
  group_code text,
  points integer NOT NULL DEFAULT 0,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own and group profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR (group_code IS NOT NULL AND group_code IN (
      SELECT p.group_code FROM public.profiles p WHERE p.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name text;
  _invite_code text;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
  _invite_code := upper(substr(md5(random()::text), 1, 8));
  
  INSERT INTO public.profiles (user_id, name, email, phone, invite_code, group_code)
  VALUES (
    NEW.id,
    _name,
    NEW.email,
    NEW.phone,
    _invite_code,
    _invite_code
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
