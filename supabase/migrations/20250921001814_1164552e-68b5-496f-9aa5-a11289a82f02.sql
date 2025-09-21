-- Fix RLS policies to avoid infinite recursion
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Admins can view all topup requests" ON public.topup_requests;

-- Create a security definer function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

-- Recreate admin policies using the security definer function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all game sessions"
ON public.game_sessions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all topup requests"
ON public.topup_requests
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add single device login support - add session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();