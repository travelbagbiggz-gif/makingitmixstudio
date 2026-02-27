import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentProjects = ({ sessions, loading, isSubscribed }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      <div className="p-5 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Icon name="clock" className="w-5 h-5 text-blue-400" />
          Recent Projects
        </h2>
        <button
          onClick={() => navigate('/project-management')}
          className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
        >
          View all
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Icon name="loader" className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : sessions?.length === 0 ? (
        <div className="p-8 text-center">
          <Icon name="folder-open" className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No projects yet</p>
          {isSubscribed && (
            <Button
              onClick={() => navigate('/recording-studio')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Start Recording
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {sessions?.map((session) => (
            <div
              key={session?.id}
              className="p-4 flex items-center gap-4 hover:bg-gray-700/30 transition-colors cursor-pointer"
              onClick={() => navigate('/recording-studio')}
            >
              <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="music" className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{session?.title || 'Untitled Session'}</p>
                <p className="text-gray-400 text-xs">{formatDate(session?.updated_at)}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session?.status)}`}>
                {session?.status?.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentProjects;
