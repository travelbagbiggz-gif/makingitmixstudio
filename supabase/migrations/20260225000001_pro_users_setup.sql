-- Pro Users Setup Migration
-- Sets permanent admin access for app owners

-- Ensure demos_used column exists (in case migration order is different)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'demos_used'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN demos_used INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update existing users to admin role if they exist
DO $$
BEGIN
  UPDATE public.user_profiles
  SET 
    role = 'admin'::public.user_role,
    subscription_expires_at = NULL,
    demos_used = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE email IN ('travelbagbiggz2025@gmail.com', 'lewda3rd@gmail.com');
END $$;

-- Create function to auto-promote pro users on signup
CREATE OR REPLACE FUNCTION public.handle_pro_user_signup()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is a pro user
  IF NEW.email IN ('travelbagbiggz2025@gmail.com', 'lewda3rd@gmail.com') THEN
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

-- Create trigger to run after user profile creation
DROP TRIGGER IF EXISTS on_pro_user_signup ON public.user_profiles;
CREATE TRIGGER on_pro_user_signup
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pro_user_signup();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_pro_user_signup() IS 'Automatically grants admin role to pro users (travelbagbiggz2025@gmail.com, lewda3rd@gmail.com) on signup';