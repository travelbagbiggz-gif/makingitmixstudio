import React from 'react';
import Icon from '../../../components/AppIcon';

const WelcomeBanner = ({ user, userProfile, successPayment, isSubscribed }) => {
  const firstName = userProfile?.full_name?.split(' ')?.[0] || user?.email?.split('@')?.[0] || 'there';

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/60 via-gray-800 to-gray-900 rounded-2xl border border-purple-500/30 p-6 lg:p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        {successPayment && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full text-green-300 text-sm font-medium mb-4">
            <Icon name="check-circle" className="w-4 h-4" />
            Subscription activated successfully!
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Welcome back, {firstName}! 🎤
            </h1>
            <p className="text-gray-400 text-base">
              {isSubscribed
                ? 'Your Pro Studio is ready. Start creating your next hit.' :'Upgrade to Pro to unlock all studio features.'}
            </p>
          </div>
          {isSubscribed && (
            <div className="flex-shrink-0 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-purple-300 text-sm font-medium">Pro Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
