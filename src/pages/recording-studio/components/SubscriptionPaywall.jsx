import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SubscriptionPaywall = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        {/* Lock Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-6">
          <Icon name="Lock" size={36} className="text-gray-500" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
          Pro Subscription Required
        </h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          The Recording Studio requires an active MakingItMix Pro Studio subscription.
          Unlock unlimited recording sessions, professional autotune, and all export features.
        </p>

        {/* Plan Card */}
        <div className="bg-gray-900 border-2 border-amber-500/30 rounded-2xl p-6 mb-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="Crown" size={18} className="text-amber-400" />
              <span className="text-amber-400 font-bold">MakingItMix Pro Studio</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">$5.99</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Unlimited recording',
              'Real-time autotune',
              'Professional presets',
              'WAV & MP3 export',
              'Auto-mix & mastering',
              'Cancel anytime',
            ]?.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Icon name="Check" size={12} className="text-amber-400 flex-shrink-0" />
                <span className="text-gray-300 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {user ? (
            <Button
              onClick={() => navigate('/stripe-subscription-checkout', { state: { from: '/recording-studio' } })}
              className="w-full py-3 font-bold text-base"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', border: 'none' }}
            >
              <Icon name="CreditCard" size={18} className="mr-2" />
              Subscribe Now — $5.99/month
            </Button>
          ) : (
            <>
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
                Sign In
              </Button>
            </>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaywall;
