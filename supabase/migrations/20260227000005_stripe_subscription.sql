-- Add Stripe subscription fields to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription_id ON public.user_profiles(stripe_subscription_id);
