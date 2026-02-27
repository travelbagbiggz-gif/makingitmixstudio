import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';

const DashboardWelcomeScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile, loading } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const sessionId = searchParams?.get('session_id');
  const isSuccess = searchParams?.get('success') === 'true';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/sign-in', { replace: true });
      return;
    }

    if (user && isSuccess && sessionId) {
      verifyAndSyncSubscription();
    } else if (user) {
      fetchSubscriptionStatus();
    }
  }, [user, loading, sessionId, isSuccess]);

  const verifyAndSyncSubscription = async () => {
    setVerifying(true);
    try {
      const { data } = await supabase?.functions?.invoke('verify-subscription', {
        body: { userId: user?.id, sessionId },
      });
      if (data?.subscriptionDetails) {
        setSubscriptionDetails(data?.subscriptionDetails);
      }
      setShowSuccessBanner(true);
    } catch (err) {
      console.error('Subscription verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase?.functions?.invoke('verify-subscription', {
        body: { userId: user?.id },
      });
      if (data?.subscriptionDetails) {
        setSubscriptionDetails(data?.subscriptionDetails);
      }
    } catch (err) {
      console.error('Fetch subscription error:', err);
    }
  };

  const isSubscribed =
    userProfile?.subscription_status === 'active' ||
    userProfile?.subscription_status === 'trialing' ||
    userProfile?.role === 'premium' ||
    userProfile?.role === 'admin';

  const quickActions = [
    {
      icon: 'Mic',
      label: 'Recording Studio',
      description: 'Record vocals with professional autotune',
      path: '/recording-studio',
      color: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      badge: 'Studio',
    },
    {
      icon: 'Sliders',
      label: 'Fine Tune Mix',
      description: 'Mix and balance your recorded tracks',
      path: '/fine-tune-mix-page',
      color: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      badge: 'Mix',
    },
    {
      icon: 'Waves',
      label: 'Mastering',
      description: 'Master your tracks for distribution',
      path: '/mastering-page',
      color: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      badge: 'Master',
    },
    {
      icon: 'FolderOpen',
      label: 'My Projects',
      description: 'View and manage your saved sessions',
      path: '/project-management',
      color: 'from-green-500/20 to-green-600/10',
      border: 'border-green-500/30',
      iconColor: 'text-green-400',
      badge: 'Projects',
    },
  ];

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">{verifying ? 'Activating your subscription...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - MakingItMix Pro Studio</title>
      </Helmet>
      <div className="min-h-screen bg-gray-950">
        <Header />
        <div className="pt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Success Banner */}
            {showSuccessBanner && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle" size={18} className="text-green-400" />
                </div>
                <div>
                  <p className="text-green-400 font-semibold">Subscription Activated!</p>
                  <p className="text-gray-400 text-sm mt-0.5">Welcome to MakingItMix Pro Studio. You now have full access to all features.</p>
                </div>
                <button onClick={() => setShowSuccessBanner(false)} className="ml-auto text-gray-500 hover:text-gray-300">
                  <Icon name="X" size={16} />
                </button>
              </div>
            )}

            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Welcome back{userProfile?.full_name ? `, ${userProfile?.full_name?.split(' ')?.[0]}` : ''}!
                </h1>
                {isSubscribed && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                    <Icon name="Crown" size={13} className="text-amber-400" />
                    <span className="text-amber-400 text-xs font-bold">PRO</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400">
                {isSubscribed
                  ? 'Your studio is ready. Start creating.' :'Subscribe to unlock full studio access.'}
              </p>
            </div>

            {/* Subscription Status Card */}
            <div className="mb-8 p-5 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSubscribed ? 'bg-amber-500/20' : 'bg-gray-800'
                  }`}>
                    <Icon name={isSubscribed ? 'Crown' : 'Lock'} size={22} className={isSubscribed ? 'text-amber-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="text-white font-semibold">MakingItMix Pro Studio</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${
                        isSubscribed ? 'bg-green-400' : 'bg-gray-500'
                      }`} />
                      <span className={`text-sm ${
                        isSubscribed ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {isSubscribed ? 'Active' : 'Inactive'}
                      </span>
                      {subscriptionDetails?.currentPeriodEnd && (
                        <span className="text-gray-500 text-sm">
                          · Renews {new Date(subscriptionDetails.currentPeriodEnd)?.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSubscribed ? (
                    <Button
                      onClick={() => navigate('/billing-account-management')}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm"
                    >
                      <Icon name="Settings" size={14} className="mr-1.5" />
                      Manage Billing
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate('/stripe-subscription-checkout')}
                      className="font-semibold text-sm"
                      style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', border: 'none' }}
                    >
                      <Icon name="CreditCard" size={14} className="mr-1.5" />
                      Subscribe — $5.99/mo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-white font-bold text-lg mb-4">Quick Access</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions?.map((action) => (
                  <button
                    key={action?.path}
                    onClick={() => navigate(action?.path)}
                    className={`group p-5 bg-gradient-to-br ${action?.color} border ${action?.border} rounded-xl text-left hover:scale-[1.02] transition-all duration-200 ${
                      !isSubscribed && action?.path === '/recording-studio' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gray-900/50 flex items-center justify-center`}>
                        <Icon name={action?.icon} size={20} className={action?.iconColor} />
                      </div>
                      {!isSubscribed && action?.path === '/recording-studio' && (
                        <Icon name="Lock" size={14} className="text-gray-500" />
                      )}
                    </div>
                    <p className="text-white font-semibold text-sm mb-1">{action?.label}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{action?.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: 'Mic', label: 'Recording Sessions', value: '∞', sub: 'Unlimited' },
                { icon: 'Music', label: 'Vocal Channels', value: '4', sub: 'Lead, Double, Adlib, Extra' },
                { icon: 'Sliders', label: 'Autotune Presets', value: '4+', sub: 'Hip-Hop, R&B, Pop, Jazz' },
                { icon: 'Download', label: 'Export Formats', value: '2', sub: 'WAV & MP3' },
              ]?.map((stat) => (
                <div key={stat?.label} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <Icon name={stat?.icon} size={18} className="text-amber-400 mb-2" />
                  <p className="text-2xl font-black text-white">{stat?.value}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{stat?.sub}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardWelcomeScreen;
