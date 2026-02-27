import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const QuickActions = ({ isSubscribed }) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: 'mic',
      label: 'Recording Studio',
      desc: 'Record, mix, and master your vocals',
      color: 'from-purple-600 to-purple-800',
      border: 'border-purple-500/30',
      action: () => navigate('/recording-studio'),
      requiresPro: true,
      badge: 'Core Feature',
    },
    {
      icon: 'folder',
      label: 'Project Management',
      desc: 'Manage and organize your sessions',
      color: 'from-blue-600 to-blue-800',
      border: 'border-blue-500/30',
      action: () => navigate('/project-management'),
      requiresPro: false,
      badge: null,
    },
    {
      icon: 'sliders',
      label: 'Fine Tune Mix',
      desc: 'Advanced mixing and EQ controls',
      color: 'from-orange-600 to-orange-800',
      border: 'border-orange-500/30',
      action: () => navigate('/fine-tune-mix-page'),
      requiresPro: true,
      badge: null,
    },
    {
      icon: 'disc',
      label: 'Mastering',
      desc: 'Professional audio mastering tools',
      color: 'from-green-600 to-green-800',
      border: 'border-green-500/30',
      action: () => navigate('/mastering-page'),
      requiresPro: true,
      badge: null,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="zap" className="w-5 h-5 text-yellow-400" />
        Quick Access
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {actions?.map((action, index) => {
          const locked = action?.requiresPro && !isSubscribed;
          return (
            <button
              key={index}
              onClick={locked ? () => {} : action?.action}
              className={`relative group text-left bg-gray-800 rounded-xl border ${action?.border} p-5 transition-all hover:scale-[1.02] ${
                locked ? 'opacity-60 cursor-not-allowed' : 'hover:border-opacity-60 cursor-pointer'
              }`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${action?.color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon name={action?.icon} className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">{action?.label}</h3>
                  <p className="text-gray-400 text-xs">{action?.desc}</p>
                </div>
                {locked ? (
                  <Icon name="lock" className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Icon name="arrow-right" className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors flex-shrink-0 mt-0.5" />
                )}
              </div>
              {action?.badge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                  {action?.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
