-- Admin Panel and Preauthorized Emails Migration
-- Adds preauthorized emails table and admin management functions

-- Create preauthorized_emails table for managing pro access
CREATE TABLE IF NOT EXISTS public.preauthorized_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  granted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_preauthorized_emails_email ON public.preauthorized_emails(email);
CREATE INDEX IF NOT EXISTS idx_preauthorized_emails_status ON public.preauthorized_emails(status);

-- Enable RLS
ALTER TABLE public.preauthorized_emails ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid() AND role = 'admin'::public.user_role
)
$$;

-- Function to check if email is preauthorized
CREATE OR REPLACE FUNCTION public.is_preauthorized(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.preauthorized_emails
  WHERE email = check_email AND status = 'active'
)
$$;

-- RLS Policies for preauthorized_emails (admin only access)
DROP POLICY IF EXISTS "admin_manage_preauthorized_emails" ON public.preauthorized_emails;
CREATE POLICY "admin_manage_preauthorized_emails"
ON public.preauthorized_emails
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update handle_pro_user_signup to check preauthorized emails
CREATE OR REPLACE FUNCTION public.handle_pro_user_signup()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is a hardcoded pro user or preauthorized
  IF NEW.email IN ('travelbagbiggz2025@gmail.com', 'lewda3rd@gmail.com') OR
     public.is_preauthorized(NEW.email) THEN
    -- Update to admin role with no subscription expiry
    UPDATE public.user_profiles
    SET 
      role = 'admin'::public.user_role,
      subscription_expires_at = NULL,
      demos_used = 0
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add initial preauthorized emails
DO $$
BEGIN
  -- Add the three admin emails as preauthorized
  INSERT INTO public.preauthorized_emails (email, status, notes)
  VALUES 
    ('travelbagbiggz2025@gmail.com', 'active', 'App owner - permanent admin access'),
    ('lewda3rd@gmail.com', 'active', 'App owner - permanent admin access')
  ON CONFLICT (email) DO UPDATE
  SET status = 'active', updated_at = CURRENT_TIMESTAMP;
  
  -- Update existing users if they already exist
  UPDATE public.user_profiles
  SET 
    role = 'admin'::public.user_role,
    subscription_expires_at = NULL,
    demos_used = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE email IN ('travelbagbiggz2025@gmail.com', 'lewda3rd@gmail.com');
END $$;

-- Function to grant pro access (admin only)
CREATE OR REPLACE FUNCTION public.grant_pro_access(
  user_email TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can grant pro access';
  END IF;
  
  -- Insert or update preauthorized email
  INSERT INTO public.preauthorized_emails (email, granted_by, status, notes)
  VALUES (user_email, auth.uid(), 'active', admin_notes)
  ON CONFLICT (email) DO UPDATE
  SET status = 'active', granted_by = auth.uid(), notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO new_id;
  
  -- If user already exists, update their profile
  SELECT id INTO existing_user_id FROM public.user_profiles WHERE email = user_email;
  IF existing_user_id IS NOT NULL THEN
    UPDATE public.user_profiles
    SET 
      role = 'admin'::public.user_role,
      subscription_expires_at = NULL,
      demos_used = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = existing_user_id;
  END IF;
  
  RETURN new_id;
END;
$$;

-- Function to revoke pro access (admin only)
CREATE OR REPLACE FUNCTION public.revoke_pro_access(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can revoke pro access';
  END IF;
  
  -- Prevent revoking hardcoded admin emails
  IF user_email IN ('travelbagbiggz2025@gmail.com', 'lewda3rd@gmail.com') THEN
    RAISE EXCEPTION 'Cannot revoke access for app owners';
  END IF;
  
  -- Update preauthorized email status
  UPDATE public.preauthorized_emails
  SET status = 'revoked', updated_at = CURRENT_TIMESTAMP
  WHERE email = user_email;
  
  -- If user exists, downgrade to free
  SELECT id INTO existing_user_id FROM public.user_profiles WHERE email = user_email;
  IF existing_user_id IS NOT NULL THEN
    UPDATE public.user_profiles
    SET 
      role = 'free'::public.user_role,
      subscription_expires_at = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = existing_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.preauthorized_emails IS 'Manages preauthorized emails for automatic pro user access';
COMMENT ON FUNCTION public.grant_pro_access(TEXT, TEXT) IS 'Admin function to grant pro access to an email address';
COMMENT ON FUNCTION public.revoke_pro_access(TEXT) IS 'Admin function to revoke pro access from an email address';