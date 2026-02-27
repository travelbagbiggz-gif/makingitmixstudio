import React from 'react';
import Icon from '../../../components/AppIcon';

const badges = [
  { icon: 'shield', label: 'SSL Secured', desc: '256-bit encryption' },
  { icon: 'lock', label: 'Stripe Secured', desc: 'PCI compliant' },
  { icon: 'refresh-cw', label: 'Cancel Anytime', desc: 'No commitment' },
  { icon: 'check-circle', label: 'Money-Back', desc: '7-day guarantee' },
];

const TrustBadges = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {badges?.map((badge, index) => (
        <div
          key={index}
          className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 text-center"
        >
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Icon name={badge?.icon} className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-white text-xs font-medium">{badge?.label}</p>
          <p className="text-gray-500 text-xs">{badge?.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
