import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CheckoutForm = ({ planName, planPrice, isLoading, error, onCheckout, userEmail }) => {
  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Summary Header */}
      <div className="bg-gradient-to-br from-purple-900/50 to-gray-800 p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-1">Order Summary</h2>
        <p className="text-gray-400 text-sm">Review your subscription details</p>
      </div>
      <div className="p-6 space-y-6">
        {/* Plan Row */}
        <div className="flex items-center justify-between py-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Icon name="music" className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">{planName}</p>
              <p className="text-gray-400 text-xs">Monthly subscription</p>
            </div>
          </div>
          <span className="text-white font-bold">{planPrice}</span>
        </div>

        {/* Billing Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white">{planPrice}/mo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Billing cycle</span>
            <span className="text-white">Monthly</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Next billing date</span>
            <span className="text-white">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)?.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </span>
          </div>
          <div className="border-t border-gray-700 pt-2 flex justify-between">
            <span className="text-white font-semibold">Total today</span>
            <span className="text-white font-bold text-lg">{planPrice}</span>
          </div>
        </div>

        {/* Account Info */}
        {userEmail && (
          <div className="bg-gray-700/50 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Subscribing as</p>
            <p className="text-white text-sm font-medium">{userEmail}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-2">
            <Icon name="alert-circle" className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={onCheckout}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-base font-semibold rounded-xl transition-all"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Icon name="loader" className="w-5 h-5 animate-spin" />
              Redirecting to Stripe...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Icon name="credit-card" className="w-5 h-5" />
              Subscribe for {planPrice}/month
            </span>
          )}
        </Button>

        <p className="text-center text-gray-500 text-xs">
          You'll be redirected to Stripe's secure checkout. Cancel anytime from your account settings.
        </p>

        {/* Stripe branding */}
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Icon name="lock" className="w-3 h-3" />
          <span className="text-xs">Powered by Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
