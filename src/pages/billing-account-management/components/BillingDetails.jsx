import React from 'react';
import Icon from '../../../components/AppIcon';

const BillingDetails = ({ userProfile, subscriptionDetails, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2]?.map((i) => (
          <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Account Info */}
      <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
        <h3 className="text-white font-semibold mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-500 text-sm">Email</span>
            <span className="text-white text-sm">{userProfile?.email || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-500 text-sm">Name</span>
            <span className="text-white text-sm">{userProfile?.full_name || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-500 text-sm">Account Type</span>
            <span className="text-white text-sm capitalize">{userProfile?.role || 'free'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-500 text-sm">Member Since</span>
            <span className="text-white text-sm">
              {userProfile?.created_at
                ? new Date(userProfile.created_at)?.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                : '—'}
            </span>
          </div>
        </div>
      </div>
      {/* Stripe Customer */}
      <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
        <h3 className="text-white font-semibold mb-4">Payment Method</h3>
        {userProfile?.stripe_customer_id ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                <Icon name="CreditCard" size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Payment method on file</p>
                <p className="text-gray-500 text-xs">Managed securely by Stripe</p>
              </div>
              <div className="ml-auto">
                <Icon name="Shield" size={16} className="text-green-400" />
              </div>
            </div>
            <p className="text-gray-600 text-xs">
              Customer ID: <span className="font-mono">{userProfile?.stripe_customer_id}</span>
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-800/30 border border-dashed border-gray-700 rounded-lg">
            <Icon name="CreditCard" size={20} className="text-gray-600" />
            <div>
              <p className="text-gray-400 text-sm">No payment method on file</p>
              <p className="text-gray-600 text-xs">Subscribe to add a payment method</p>
            </div>
          </div>
        )}
      </div>
      {/* Subscription Details */}
      {subscriptionDetails && (
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Subscription Details</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-500 text-sm">Status</span>
              <span className={`text-sm font-medium capitalize ${
                subscriptionDetails?.status === 'active' ? 'text-green-400' : 'text-gray-400'
              }`}>{subscriptionDetails?.status || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-500 text-sm">Price ID</span>
              <span className="text-white text-xs font-mono truncate max-w-[200px]">{subscriptionDetails?.priceId || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500 text-sm">Auto-renew</span>
              <span className={`text-sm ${subscriptionDetails?.cancelAtPeriodEnd ? 'text-yellow-400' : 'text-green-400'}`}>
                {subscriptionDetails?.cancelAtPeriodEnd ? 'Off (cancels at period end)' : 'On'}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Security Notice */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex items-start gap-3">
          <Icon name="Shield" size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Secure Payments by Stripe</p>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              Your payment information is encrypted and stored securely by Stripe. MakingItMix Pro Studio never stores your card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDetails;
