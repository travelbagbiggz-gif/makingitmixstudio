/// <reference lib="deno.ns" />

import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { userId, email, priceId, successUrl, cancelUrl } = await req.json();

    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      stripeCustomerId = profile?.stripe_customer_id ?? null;
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { supabase_user_id: userId ?? '' },
      });
      stripeCustomerId = customer.id;

      if (userId) {
        await supabase
          .from('user_profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', userId);
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: userId ?? '',
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId ?? '',
        },
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
