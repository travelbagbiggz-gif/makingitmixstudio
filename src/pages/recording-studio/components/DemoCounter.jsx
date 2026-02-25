import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';

const DemoCounter = () => {
  const { user, userProfile, isProUser, hasProAccess } = useAuth();
  const [demosUsed, setDemosUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const MAX_DEMOS = 3;

  useEffect(() => {
    if (user && userProfile) {
      fetchDemoCount();
    } else {
      setLoading(false);
    }
  }, [user, userProfile]);

  const fetchDemoCount = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select('demos_used')
        ?.eq('id', user?.id)
        ?.single();

      if (error) throw error;
      setDemosUsed(data?.demos_used || 0);
    } catch (error) {
      console.error('Error fetching demo count:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show counter for pro users
  if (isProUser || hasProAccess()) {
    return (
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-600 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <Icon name="Crown" size={20} color="#ffffff" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-400">PRO USER</p>
              <p className="text-xs text-gray-400">Unlimited recordings & features</p>
            </div>
          </div>
          <Icon name="Infinity" size={24} color="#a855f7" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center">
        <Icon name="Loader" size={20} className="animate-spin" color="#9ca3af" />
      </div>
    );
  }

  const demosRemaining = MAX_DEMOS - demosUsed;
  const isLimitReached = demosUsed >= MAX_DEMOS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">
          Demo Counter
        </h3>
        {isProUser && (
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent rounded-full">
            <Icon name="Crown" size={14} color="var(--color-accent)" />
            <span className="text-xs font-semibold text-accent">PRO USER</span>
          </div>
        )}
      </div>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
        isLimitReached ? 'bg-error/10 border-error/20' : demosRemaining <= 1 ?'bg-warning/10 border-warning/20': 'bg-muted border-border'
      }`}>
        <Icon 
          name={isLimitReached ? 'XCircle' : demosRemaining <= 1 ? 'AlertTriangle' : 'Music'} 
          size={18} 
          color={isLimitReached ? 'var(--color-error)' : demosRemaining <= 1 ? 'var(--color-warning)' : 'var(--color-accent)'}
        />
        <span className={`text-sm font-medium ${
          isLimitReached ? 'text-error' : demosRemaining <= 1 ?'text-warning': 'text-foreground'
        }`}>
          {isLimitReached ? 'No demos remaining' : `${demosRemaining} demo${demosRemaining !== 1 ? 's' : ''} remaining`}
        </span>
      </div>
    </div>
  );
};

export default DemoCounter;