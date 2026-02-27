import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const PRICE_ID = 'price_1T5HXGCSIl1Zg7b9iuRaL5Wv';
const PLAN_PRICE = '$5.99';
const PLAN_NAME = 'MakingItMix Pro Studio';

const features = [
  'Unlimited recording sessions',
  'All professional presets (Hip-Hop, R&B, Pop, Jazz)',
  'Zero latency recording',
  'Automated mixing and mastering',
  'WAV and MP3 export',
  'Save unlimited projects',
  'Real-time autotune with adjustable speed',
  'Multi-layer recording (4 vocal channels)',
  'Professional EQ, reverb, and echo controls',
  'Priority customer support',
];

const StripeSubscriptionCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if redirected from paywall
  const redirectedFrom = location?.state?.from || '/recording-studio';

  useEffect(() => {
    // If user already has active subscription, redirect to dashboard
    if (!loading && userProfile) {
      const isActive =
        userProfile?.subscription_status === 'active' ||
        userProfile?.subscription_status === 'trialing' ||
        userProfile?.role === 'premium' ||
        userProfile?.role === 'admin';
      if (isActive) {
        navigate('/dashboard-welcome-screen', { replace: true });
      }
    }
  }, [userProfile, loading, navigate]);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/sign-in', { state: { from: '/stripe-subscription-checkout' } });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const successUrl = `${window.location?.origin}/dashboard-welcome-screen?session_id={CHECKOUT_SESSION_ID}&success=true`;
      const cancelUrl = `${window.location?.origin}/stripe-subscription-checkout`;

      const { data, error: fnError } = await supabase?.functions?.invoke('create-checkout-session', {
        body: {
          userId: user?.id,
          email: user?.email,
          priceId: PRICE_ID,
          successUrl,
          cancelUrl,
        },
      });

      if (fnError || data?.error) {
        throw new Error(fnError?.message || data?.error || 'Failed to create checkout session');
      }

      if (data?.url) {
        window.location.href = data?.url;
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Subscribe - MakingItMix Pro Studio</title>
      </Helmet>
      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800/60 bg-gray-950/98 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden ring-1 ring-amber-500/30 group-hover:ring-amber-500/60 transition-all">
                <img
                  src="/assets/images/JPEG_image-4055-9F47-20-0-1772030553207.jpeg"
                  alt="MakingItMix Pro Studio logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className="text-base font-black tracking-widest uppercase"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 40%, #ffffff 60%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                MIX PRO STUDIO
              </span>
            </button>
            {user && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Icon name="ArrowLeft" size={16} />
                Back
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-4">
                <Icon name="Crown" size={14} />
                <span>Pro Subscription</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
                Unlock Your Full Studio
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Get unlimited access to all professional recording, mixing, and mastering tools.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Pricing Card */}
              <div className="bg-gray-900 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-amber-400 uppercase tracking-widest">Monthly Plan</span>
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full">MOST POPULAR</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white">{PLAN_PRICE}</span>
                    <span className="text-gray-400 text-lg">/month</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Billed monthly · Cancel anytime</p>
                  <p className="text-amber-400 font-semibold mt-2">{PLAN_NAME}</p>
                </div>

                <div className="p-6">
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                      <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {!user ? (
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate('/sign-up', { state: { from: '/stripe-subscription-checkout' } })}
                        className="w-full py-3 font-bold text-base"
                        style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', border: 'none' }}
                      >
                        <Icon name="UserPlus" size={18} className="mr-2" />
                        Create Account & Subscribe
                      </Button>
                      <Button
                        onClick={() => navigate('/sign-in', { state: { from: '/stripe-subscription-checkout' } })}
                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
                      >
                        Sign In to Subscribe
                      </Button>
                      <p className="text-center text-gray-500 text-xs">Account required for subscription management</p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCheckout}
                      disabled={isLoading}
                      className="w-full py-3 font-bold text-base"
                      style={{ background: isLoading ? '#374151' : 'linear-gradient(135deg, #d97706, #f59e0b)', color: isLoading ? '#9ca3af' : '#000', border: 'none' }}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Redirecting to Checkout...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Icon name="CreditCard" size={18} />
                          Subscribe Now — {PLAN_PRICE}/mo
                        </span>
                      )}
                    </Button>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {[{ icon: 'Shield', text: 'SSL Secured' }, { icon: 'Lock', text: 'Encrypted' }, { icon: 'RefreshCw', text: 'Cancel Anytime' }]?.map((badge) => (
                      <div key={badge?.text} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Icon name={badge?.icon} size={12} className="text-green-500" />
                        <span>{badge?.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <h3 className="text-white font-bold text-lg mb-4">Everything included:</h3>
                {features?.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="Check" size={11} className="text-amber-400" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}

                <div className="mt-6 p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Zap" size={16} className="text-amber-400" />
                    <span className="text-white font-semibold text-sm">Powered by Stripe</span>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Your payment is processed securely by Stripe. We never store your card details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StripeSubscriptionCheckout;
