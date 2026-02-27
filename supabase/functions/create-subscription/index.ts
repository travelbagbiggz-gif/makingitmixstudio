import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

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

    const { priceId, userId, email, successUrl, cancelUrl } = await req.json();

    if (!priceId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: priceId, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if customer already exists
    let customerId: string | undefined
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

      customerId = profile?.stripe_customer_id
    }

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: userId ?? 'guest' },
      })
      customerId = customer.id

      // Save customer ID to profile if user is authenticated
      if (userId) {
        await supabase
          .from('user_profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId)
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl ?? `${req.headers.get('origin')}/dashboard-welcome-screen?success=true`,
      cancel_url: cancelUrl ?? `${req.headers.get('origin')}/stripe-subscription-checkout?canceled=true`,
      metadata: { userId: userId ?? 'guest' },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Stripe error:', error)
    return new Response(
      JSON.stringify({ error: error.message ?? 'Payment processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
