import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const AccountManagement = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingSession, setUploadingSession] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/sign-in');
    } else if (user) {
      fetchSessions();
    }
  }, [user, authLoading, navigate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase?.from('audio_sessions')?.select('*')?.eq('user_id', user?.id)?.order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSessions(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSession = async (sessionId, title) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase?.from('audio_sessions')?.select('*, recordings(*)')?.eq('id', sessionId)?.single();

      if (sessionError) throw sessionError;

      const exportData = {
        session: sessionData,
        exportedAt: new Date()?.toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title?.replace(/\s+/g, '-')}-${Date.now()}.json`;
      document.body?.appendChild(a);
      a?.click();
      document.body?.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || 'Failed to download session');
    }
  };

  const handleUploadSession = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    try {
      setUploadingSession(true);
      setError('');

      const text = await file?.text();
      const importData = JSON.parse(text);

      if (!importData?.session) {
        throw new Error('Invalid session file format');
      }

      const sessionToImport = {
        ...importData?.session,
        id: undefined,
        user_id: user?.id,
        title: `${importData?.session?.title} (Imported)`,
        created_at: undefined,
        updated_at: undefined
      };

      const { data: newSession, error: insertError } = await supabase?.from('audio_sessions')?.insert([sessionToImport])?.select()?.single();

      if (insertError) throw insertError;

      await fetchSessions();
      alert('Session imported successfully!');
    } catch (err) {
      setError(err?.message || 'Failed to upload session');
    } finally {
      setUploadingSession(false);
      event.target.value = '';
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase?.from('audio_sessions')?.delete()?.eq('id', sessionId);

      if (deleteError) throw deleteError;

      setSessions(sessions?.filter(s => s?.id !== sessionId));
    } catch (err) {
      setError(err?.message || 'Failed to delete session');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'archived':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Icon name="loader" className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Account Management - MAKINGITMIXPROSTUDIO</title>
      </Helmet>
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Account Management</h1>
            <p className="text-gray-400">Manage your sessions and account settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <Icon name="user" className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{userProfile?.full_name || 'User'}</h3>
                  <p className="text-sm text-gray-400">{userProfile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/50">
                  {userProfile?.role?.toUpperCase() || 'FREE'}
                </span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="folder" className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Total Sessions</h3>
              </div>
              <p className="text-4xl font-bold text-white">{sessions?.length}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="upload" className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Import Session</h3>
              </div>
              <label htmlFor="session-upload" className="cursor-pointer">
                <input
                  id="session-upload"
                  type="file"
                  accept=".json"
                  onChange={handleUploadSession}
                  disabled={uploadingSession}
                  className="hidden"
                />
                <Button
                  as="span"
                  disabled={uploadingSession}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {uploadingSession ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="loader" className="w-4 h-4 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="upload" className="w-4 h-4" />
                      Upload Session
                    </span>
                  )}
                </Button>
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="alert-circle" className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Your Sessions</h2>
            </div>
            <div className="divide-y divide-gray-700">
              {sessions?.length === 0 ? (
                <div className="p-12 text-center">
                  <Icon name="folder-open" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No sessions yet</p>
                  <Button
                    onClick={() => navigate('/recording-studio')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Create Your First Session
                  </Button>
                </div>
              ) : (
                sessions?.map((session) => (
                  <div key={session?.id} className="p-6 hover:bg-gray-750 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{session?.title}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(session?.status)}`}>
                            {session?.status?.replace('_', ' ')?.toUpperCase()}
                          </span>
                        </div>
                        {session?.description && (
                          <p className="text-gray-400 text-sm mb-3">{session?.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Icon name="calendar" className="w-4 h-4" />
                            {formatDate(session?.updated_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="music" className="w-4 h-4" />
                            {session?.preset}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          onClick={() => handleDownloadSession(session?.id, session?.title)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                        >
                          <Icon name="download" className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteSession(session?.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                        >
                          <Icon name="trash-2" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountManagement;