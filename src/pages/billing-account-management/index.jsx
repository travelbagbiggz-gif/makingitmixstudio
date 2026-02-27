import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';

import Header from '../../components/ui/Header';
import SubscriptionOverview from './components/SubscriptionOverview';
import BillingDetails from './components/BillingDetails';
import CancelSubscriptionModal from './components/CancelSubscriptionModal';

const BillingAccountManagement = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeTab, setActiveTab] = useState('subscription');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/sign-in', { replace: true });
      return;
    }
    if (user) {
      fetchSubscriptionDetails();
    }
  }, [user, loading]);

  const fetchSubscriptionDetails = async () => {
    setLoadingSubscription(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase?.functions?.invoke('verify-subscription', {
        body: { userId: user?.id },
      });
      if (fnError) throw new Error(fnError.message);
      setSubscriptionDetails(data?.subscriptionDetails);
    } catch (err) {
      setError(err?.message || 'Failed to load subscription details');
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleCancelSubscription = async (immediate = false) => {
    try {
      const { data, error: fnError } = await supabase?.functions?.invoke('cancel-subscription', {
        body: { userId: user?.id, cancelAtPeriodEnd: !immediate },
      });
      if (fnError || data?.error) throw new Error(fnError?.message || data?.error);
      setShowCancelModal(false);
      await fetchSubscriptionDetails();
    } catch (err) {
      setError(err?.message || 'Failed to cancel subscription');
    }
  };

  const isSubscribed =
    userProfile?.subscription_status === 'active' ||
    userProfile?.subscription_status === 'trialing' ||
    userProfile?.role === 'premium' ||
    userProfile?.role === 'admin';

  const tabs = [
    { id: 'subscription', label: 'Subscription', icon: 'Crown' },
    { id: 'billing', label: 'Billing Info', icon: 'CreditCard' },
    { id: 'usage', label: 'Usage', icon: 'BarChart2' },
  ];

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
        <title>Billing & Account - MakingItMix Pro Studio</title>
      </Helmet>
      <div className="min-h-screen bg-gray-950">
        <Header />
        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => navigate('/dashboard-welcome-screen')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <Icon name="ArrowLeft" size={18} />
              </button>
              <div>
                <h1 className="text-2xl font-black text-white">Billing & Account</h1>
                <p className="text-gray-500 text-sm">Manage your subscription and billing</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <Icon name="AlertCircle" size={16} className="text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-gray-500 hover:text-gray-300">
                  <Icon name="X" size={14} />
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl mb-6">
              {tabs?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab?.id
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon name={tab?.icon} size={15} />
                  <span className="hidden sm:inline">{tab?.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'subscription' && (
              <SubscriptionOverview
                userProfile={userProfile}
                subscriptionDetails={subscriptionDetails}
                isSubscribed={isSubscribed}
                loading={loadingSubscription}
                onCancel={() => setShowCancelModal(true)}
                onSubscribe={() => navigate('/stripe-subscription-checkout')}
                onRefresh={fetchSubscriptionDetails}
              />
            )}

            {activeTab === 'billing' && (
              <BillingDetails
                userProfile={userProfile}
                subscriptionDetails={subscriptionDetails}
                loading={loadingSubscription}
              />
            )}

            {activeTab === 'usage' && (
              <div className="space-y-4">
                <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
                  <h3 className="text-white font-semibold mb-4">Usage Overview</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Recording Sessions', value: 'Unlimited', icon: 'Mic', color: 'text-amber-400' },
                      { label: 'Projects Saved', value: 'Unlimited', icon: 'FolderOpen', color: 'text-blue-400' },
                      { label: 'Exports', value: 'Unlimited', icon: 'Download', color: 'text-green-400' },
                    ]?.map((item) => (
                      <div key={item?.label} className="p-4 bg-gray-800/50 rounded-lg">
                        <Icon name={item?.icon} size={20} className={`${item?.color} mb-2`} />
                        <p className="text-white font-bold text-xl">{item?.value}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{item?.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
                  <h3 className="text-white font-semibold mb-4">Feature Access</h3>
                  <div className="space-y-3">
                    {[
                      { feature: 'Recording Studio', access: isSubscribed },
                      { feature: 'Fine Tune Mix', access: true },
                      { feature: 'Mastering Page', access: true },
                      { feature: 'All Autotune Presets', access: isSubscribed },
                      { feature: 'WAV Export', access: isSubscribed },
                      { feature: 'MP3 Export', access: isSubscribed },
                    ]?.map((item) => (
                      <div key={item?.feature} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                        <span className="text-gray-300 text-sm">{item?.feature}</span>
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${
                          item?.access ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          <Icon name={item?.access ? 'CheckCircle' : 'XCircle'} size={14} />
                          {item?.access ? 'Included' : 'Requires Pro'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      {showCancelModal && (
        <CancelSubscriptionModal
          subscriptionDetails={subscriptionDetails}
          onConfirm={handleCancelSubscription}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </>
  );
};

export default BillingAccountManagement;
