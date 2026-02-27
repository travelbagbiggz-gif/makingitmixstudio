import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CancelSubscriptionModal = ({ subscriptionDetails, onConfirm, onClose }) => {
  const [canceling, setCanceling] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    setCanceling(true);
    await onConfirm(false); // cancel at period end
    setCanceling(false);
  };

  const endDate = subscriptionDetails?.currentPeriodEnd
    ? new Date(subscriptionDetails.currentPeriodEnd)?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'end of billing period';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Icon name="AlertTriangle" size={22} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Cancel Subscription?</h3>
              <p className="text-gray-400 text-sm mt-1">
                Your subscription will remain active until <span className="text-white font-medium">{endDate}</span>. After that, you'll lose access to Pro features.
              </p>
            </div>
          </div>

          {/* Retention Offer */}
          <div className="mb-5 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Gift" size={16} className="text-amber-400" />
              <span className="text-amber-400 font-semibold text-sm">Before you go...</span>
            </div>
            <p className="text-gray-400 text-sm">
              You'll lose access to unlimited recording sessions, professional presets, and all export features.
            </p>
          </div>

          {/* Reason */}
          <div className="mb-5">
            <label className="block text-gray-400 text-sm mb-2">Reason for canceling (optional)</label>
            <select
              value={reason}
              onChange={(e) => setReason(e?.target?.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Select a reason...</option>
              <option value="too_expensive">Too expensive</option>
              <option value="not_using">Not using it enough</option>
              <option value="missing_features">Missing features I need</option>
              <option value="technical_issues">Technical issues</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
            >
              Keep Subscription
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={canceling}
              className="flex-1 bg-red-900/30 hover:bg-red-900/50 border border-red-500/40 text-red-400 hover:text-red-300"
            >
              {canceling ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  Canceling...
                </span>
              ) : (
                'Confirm Cancel'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;
