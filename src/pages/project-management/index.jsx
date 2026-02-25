import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Input from '../../components/ui/Input';

const ProjectManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

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
      const { data, error: fetchError } = await supabase
        ?.from('audio_sessions')
        ?.select('*')
        ?.eq('user_id', user?.id)
        ?.order(sortBy, { ascending: false });

      if (fetchError) throw fetchError;
      setSessions(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (sessionId) => {
    if (!editTitle?.trim()) return;

    try {
      const { error: updateError } = await supabase
        ?.from('audio_sessions')
        ?.update({ title: editTitle })
        ?.eq('id', sessionId);

      if (updateError) throw updateError;

      setSessions(sessions?.map(s => 
        s?.id === sessionId ? { ...s, title: editTitle } : s
      ));
      setEditingId(null);
      setEditTitle('');
    } catch (err) {
      setError(err?.message || 'Failed to rename project');
    }
  };

  const handleDelete = async (sessionId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        ?.from('audio_sessions')
        ?.delete()
        ?.eq('id', sessionId);

      if (deleteError) throw deleteError;

      setSessions(sessions?.filter(s => s?.id !== sessionId));
    } catch (err) {
      setError(err?.message || 'Failed to delete project');
    }
  };

  const handleDuplicate = async (session) => {
    try {
      const newSession = {
        ...session,
        id: undefined,
        title: `${session?.title} (Copy)`,
        created_at: undefined,
        updated_at: undefined
      };

      const { data, error: insertError } = await supabase
        ?.from('audio_sessions')
        ?.insert([newSession])
        ?.select()
        ?.single();

      if (insertError) throw insertError;

      setSessions([data, ...sessions]);
    } catch (err) {
      setError(err?.message || 'Failed to duplicate project');
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
        return 'bg-success/20 text-success border-success/50';
      case 'in_progress':
        return 'bg-accent/20 text-accent border-accent/50';
      case 'draft':
        return 'bg-muted text-muted-foreground border-border';
      case 'archived':
        return 'bg-warning/20 text-warning border-warning/50';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredSessions = sessions?.filter(session =>
    session?.title?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-foreground">
          <Icon name="Loader" className="w-6 h-6 animate-spin" />
          <span>Loading projects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Project Management - MAKINGITMIXPROSTUDIO</title>
      </Helmet>
      <Header />

      <main className="pt-[80px] pb-12">
        <div className="container-studio">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-h2 font-heading mb-2">My Projects</h1>
                <p className="text-muted-foreground">
                  Manage your recording sessions and projects
                </p>
              </div>
              <Button
                variant="default"
                onClick={() => navigate('/recording-studio')}
                iconName="Plus"
                iconPosition="left"
              >
                New Project
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e?.target?.value)}
                  iconName="Search"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'updated_at' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('updated_at');
                    fetchSessions();
                  }}
                  iconName="Clock"
                  iconPosition="left"
                >
                  Recent
                </Button>
                <Button
                  variant={sortBy === 'title' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('title');
                    fetchSessions();
                  }}
                  iconName="AlignLeft"
                  iconPosition="left"
                >
                  Name
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30 flex items-center gap-3">
              <Icon name="AlertCircle" size={20} className="text-error" />
              <span className="text-error">{error}</span>
            </div>
          )}

          {filteredSessions?.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Icon name="FolderOpen" size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'Try a different search term' : 'Create your first recording project'}
              </p>
              {!searchTerm && (
                <Button
                  variant="default"
                  onClick={() => navigate('/recording-studio')}
                  iconName="Plus"
                  iconPosition="left"
                >
                  New Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions?.map((session) => (
                <div
                  key={session?.id}
                  className="bg-card rounded-lg border border-border p-6 hover:shadow-studio transition-studio"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      {editingId === session?.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e?.target?.value)}
                            onKeyDown={(e) => {
                              if (e?.key === 'Enter') handleRename(session?.id);
                              if (e?.key === 'Escape') {
                                setEditingId(null);
                                setEditTitle('');
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRename(session?.id)}
                            iconName="Check"
                          />
                        </div>
                      ) : (
                        <h3 className="text-lg font-medium truncate mb-1">
                          {session?.title}
                        </h3>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(session?.updated_at)}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${
                      getStatusColor(session?.status)
                    }`}>
                      {session?.status?.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Icon name="Music" size={16} />
                    <span>{session?.preset || 'No preset'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => navigate('/recording-studio')}
                      iconName="Play"
                      iconPosition="left"
                    >
                      Open
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(session?.id);
                        setEditTitle(session?.title);
                      }}
                      iconName="Edit"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(session)}
                      iconName="Copy"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(session?.id, session?.title)}
                      iconName="Trash2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectManagement;