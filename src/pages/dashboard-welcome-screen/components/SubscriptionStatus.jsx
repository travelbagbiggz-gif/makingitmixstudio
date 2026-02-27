import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SubscriptionStatus = ({ subscriptionData, loading, isSubscribed, userProfile }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="loader" className="w-4 h-4 text-gray-400 animate-spin" />
          <span className="text-gray-400 text-sm">Checking subscription...</span>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="bg-gray-800 rounded-2xl border border-yellow-500/30 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
            <Icon name="crown" className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Free Plan</h3>
            <p className="text-gray-400 text-xs">Limited access</p>
          </div>
        </div>
        <p className="text-gray-400 text-xs mb-4">
          Upgrade to Pro Studio for unlimited recording, professional presets, and advanced mixing tools.
        </p>
        <Button
          onClick={() => navigate('/stripe-subscription-checkout')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
        >
          <span className="flex items-center justify-center gap-2">
            <Icon name="zap" className="w-4 h-4" />
            Upgrade to Pro — $5.99/mo
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl border border-green-500/30 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
          <Icon name="check-circle" className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Pro Studio Active</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs">Subscription active</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Plan</span>
          <span className="text-white">MakingItMix Pro Studio</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Price</span>
          <span className="text-white">$5.99/month</span>
        </div>
        {subscriptionData?.currentPeriodEnd && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Renews</span>
            <span className="text-white">{formatDate(subscriptionData?.currentPeriodEnd)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Status</span>
          <span className="text-green-400 font-medium">Active</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/account-management')}
        className="w-full text-center text-purple-400 hover:text-purple-300 text-xs transition-colors py-2 border border-gray-700 rounded-lg hover:border-gray-600"
      >
        Manage Billing
      </button>
    </div>
  );
};

export default SubscriptionStatus;
