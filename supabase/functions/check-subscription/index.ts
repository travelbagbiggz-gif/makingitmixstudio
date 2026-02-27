import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Deno global type declaration for runtime environment
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ isActive: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile with stripe customer id
    const { data: profile } = await supabase.from('user_profiles').select('stripe_customer_id, role, subscription_expires_at').eq('id', userId).single()

    // Check if admin/premium role
    if (profile?.role === 'admin' || profile?.role === 'premium') {
      if (!profile?.subscription_expires_at) {
        return new Response(
          JSON.stringify({ isActive: true, plan: 'MakingItMix Pro Studio' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const isActive = new Date(profile.subscription_expires_at) > new Date()
      return new Response(
        JSON.stringify({ isActive, plan: 'MakingItMix Pro Studio' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ isActive: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check Stripe subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: profile?.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    const isActive = subscriptions.data.length > 0
    const subscription = subscriptions.data[0]

    if (isActive && subscription) {
      // Update user profile to premium
      await supabase.from('user_profiles').update({
          role: 'premium',
          subscription_expires_at: new Date(subscription.current_period_end * 1000)?.toISOString(),
        }).eq('id', userId)
    }

    return new Response(
      JSON.stringify({
        isActive,
        plan: isActive ? 'MakingItMix Pro Studio' : null,
        currentPeriodEnd: subscription ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Subscription check error:', error)
    return new Response(
      JSON.stringify({ isActive: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
