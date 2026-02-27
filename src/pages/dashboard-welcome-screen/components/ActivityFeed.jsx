import React from 'react';
import Icon from '../../../components/AppIcon';

const ActivityFeed = ({ sessions, loading }) => {
  const recentActivity = sessions?.slice(0, 4)?.map((session) => ({
    id: session?.id,
    icon: session?.status === 'completed' ? 'check-circle' : 'music',
    color: session?.status === 'completed' ? 'text-green-400' : 'text-blue-400',
    bg: session?.status === 'completed' ? 'bg-green-500/10' : 'bg-blue-500/10',
    text: session?.status === 'completed'
      ? `Completed "${session?.title || 'Untitled'}"`
      : `Working on "${session?.title || 'Untitled'}"`,
    time: new Date(session?.updated_at)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
      <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
        <Icon name="activity" className="w-4 h-4 text-purple-400" />
        Recent Activity
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Icon name="loader" className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : recentActivity?.length === 0 ? (
        <p className="text-gray-500 text-xs text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {recentActivity?.map((item) => (
            <div key={item?.id} className="flex items-start gap-3">
              <div className={`w-7 h-7 ${item?.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon name={item?.icon} className={`w-3.5 h-3.5 ${item?.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-xs leading-relaxed truncate">{item?.text}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item?.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
