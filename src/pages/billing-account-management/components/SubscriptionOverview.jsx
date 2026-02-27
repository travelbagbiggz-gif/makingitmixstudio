import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SubscriptionOverview = ({
  userProfile,
  subscriptionDetails,
  isSubscribed,
  loading,
  onCancel,
  onSubscribe,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2]?.map((i) => (
          <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statusConfig = {
    active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-400', dot: 'bg-green-400' },
    trialing: { label: 'Trial', color: 'text-blue-400', bg: 'bg-blue-400', dot: 'bg-blue-400' },
    past_due: { label: 'Past Due', color: 'text-red-400', bg: 'bg-red-400', dot: 'bg-red-400' },
    canceled: { label: 'Canceled', color: 'text-gray-400', bg: 'bg-gray-400', dot: 'bg-gray-400' },
    inactive: { label: 'Inactive', color: 'text-gray-500', bg: 'bg-gray-500', dot: 'bg-gray-500' },
  };

  const status = userProfile?.subscription_status || 'inactive';
  const statusInfo = statusConfig?.[status] || statusConfig?.inactive;

  return (
    <div className="space-y-4">
      {/* Current Plan */}
      <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-white font-semibold">Current Plan</h3>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="Refresh"
          >
            <Icon name="RefreshCw" size={14} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              isSubscribed ? 'bg-amber-500/20' : 'bg-gray-800'
            }`}>
              <Icon name={isSubscribed ? 'Crown' : 'Lock'} size={26} className={isSubscribed ? 'text-amber-400' : 'text-gray-500'} />
            </div>
            <div>
              <p className="text-white font-bold">MakingItMix Pro Studio</p>
              <p className="text-gray-400 text-sm">$5.99 / month</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${statusInfo?.dot}`} />
                <span className={`text-sm font-medium ${statusInfo?.color}`}>{statusInfo?.label}</span>
              </div>
            </div>
          </div>

          {isSubscribed ? (
            <div className="flex flex-col gap-2">
              {subscriptionDetails?.cancelAtPeriodEnd ? (
                <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-xs font-medium">Cancels on {new Date(subscriptionDetails?.currentPeriodEnd)?.toLocaleDateString()}</p>
                </div>
              ) : (
                <Button
                  onClick={onCancel}
                  className="bg-gray-800 hover:bg-red-900/30 border border-gray-700 hover:border-red-500/40 text-gray-300 hover:text-red-400 text-sm transition-all"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={onSubscribe}
              className="font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', border: 'none' }}
            >
              <Icon name="CreditCard" size={14} className="mr-1.5" />
              Subscribe — $5.99/mo
            </Button>
          )}
        </div>
      </div>
      {/* Billing Cycle */}
      {isSubscribed && subscriptionDetails && (
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Billing Cycle</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">Next Billing Date</p>
              <p className="text-white font-semibold">
                {subscriptionDetails?.currentPeriodEnd
                  ? new Date(subscriptionDetails.currentPeriodEnd)?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">Billing Amount</p>
              <p className="text-white font-semibold">
                {subscriptionDetails?.amount
                  ? `$${(subscriptionDetails?.amount / 100)?.toFixed(2)} ${subscriptionDetails?.currency?.toUpperCase()}`
                  : '$5.99 USD'}
              </p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">Billing Interval</p>
              <p className="text-white font-semibold capitalize">{subscriptionDetails?.interval || 'Monthly'}</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-500 text-xs mb-1">Subscription ID</p>
              <p className="text-white font-mono text-xs truncate">{subscriptionDetails?.id || userProfile?.stripe_subscription_id || '—'}</p>
            </div>
          </div>
        </div>
      )}
      {/* Plan Features */}
      <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
        <h3 className="text-white font-semibold mb-4">Plan Includes</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            'Unlimited recording sessions',
            'All professional presets',
            'Zero latency recording',
            'Automated mixing & mastering',
            'WAV and MP3 export',
            'Real-time autotune',
            'Multi-layer recording (4 channels)',
            'Priority customer support',
          ]?.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <Icon name="Check" size={13} className={isSubscribed ? 'text-amber-400' : 'text-gray-600'} />
              <span className={`text-sm ${isSubscribed ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionOverview;
