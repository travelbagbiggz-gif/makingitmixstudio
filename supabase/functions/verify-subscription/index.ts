import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Add this block - Declare Deno type for Deno Deploy environment
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};
// End of added block

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req?.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    })

    const supabase = createClient(
      Deno?.env?.get('SUPABASE_URL') ?? '',
      Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, sessionId } = await req?.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // If sessionId provided, retrieve session and update subscription
    if (sessionId) {
      const session = await stripe?.checkout?.sessions?.retrieve(sessionId, {
        expand: ['subscription'],
      })

      if (session?.subscription && typeof session?.subscription !== 'string') {
        const sub = session?.subscription
        let isActive = sub?.status === 'active' || sub?.status === 'trialing'
        const expiresAt = new Date(sub.current_period_end * 1000)?.toISOString()
        const priceId = sub?.items?.data?.[0]?.price?.id ?? null

        await supabase?.from('user_profiles')?.update({
            stripe_subscription_id: sub?.id,
            stripe_customer_id: typeof session?.customer === 'string' ? session?.customer : session?.customer?.id,
            subscription_status: sub?.status,
            subscription_price_id: priceId,
            role: isActive ? 'premium' : 'free',
            subscription_expires_at: expiresAt,
          })?.eq('id', userId)
      }
    }

    // Return current subscription status
    const { data: profile } = await supabase?.from('user_profiles')?.select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_price_id, role, subscription_expires_at')?.eq('id', userId)?.single()

    // If has stripe_subscription_id, verify with Stripe
    let isActive = false
    let subscriptionDetails = null

    if (profile?.stripe_subscription_id) {
      try {
        const sub = await stripe?.subscriptions?.retrieve(profile?.stripe_subscription_id)
        isActive = sub?.status === 'active' || sub?.status === 'trialing'
        subscriptionDetails = {
          id: sub?.id,
          status: sub?.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000)?.toISOString(),
          cancelAtPeriodEnd: sub?.cancel_at_period_end,
          priceId: sub?.items?.data?.[0]?.price?.id,
          amount: sub?.items?.data?.[0]?.price?.unit_amount,
          currency: sub?.items?.data?.[0]?.price?.currency,
          interval: sub?.items?.data?.[0]?.price?.recurring?.interval,
        }

        // Sync status to DB
        await supabase?.from('user_profiles')?.update({
            subscription_status: sub?.status,
            role: isActive ? 'premium' : 'free',
            subscription_expires_at: new Date(sub.current_period_end * 1000)?.toISOString(),
          })?.eq('id', userId)
      } catch (e) {
        // Subscription not found in Stripe
        isActive = false
      }
    }

    return new Response(
      JSON.stringify({
        isActive,
        profile,
        subscriptionDetails,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
