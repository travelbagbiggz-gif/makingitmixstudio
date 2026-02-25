import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import AdminAnalytics from './components/AdminAnalytics';

// Admin emails with access to admin panel
const ADMIN_EMAILS = ['travelbagbiggz2025@gmail.com', 'lewda3rd@gmail.com'];

const AdminPanel = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [preauthorizedEmails, setPreauthorizedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('user-management');

  // Check if current user is authorized admin
  const isAuthorizedAdmin = user && ADMIN_EMAILS?.includes(user?.email?.toLowerCase());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/sign-in', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAuthorizedAdmin) {
      fetchPreauthorizedEmails();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthorizedAdmin, authLoading]);

  const fetchPreauthorizedEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('preauthorized_emails')?.select('*')?.order('created_at', { ascending: false });

      if (error) throw error;
      setPreauthorizedEmails(data || []);
    } catch (err) {
      console.error('Error fetching preauthorized emails:', err);
      setError('Failed to load preauthorized emails');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e) => {
    e?.preventDefault();
    if (!newEmail?.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase?.rpc('grant_pro_access', {
        user_email: newEmail?.trim()?.toLowerCase(),
        admin_notes: notes?.trim() || null
      });

      if (error) throw error;

      setSuccess(`Pro access granted to ${newEmail}`);
      setNewEmail('');
      setNotes('');
      await fetchPreauthorizedEmails();
    } catch (err) {
      console.error('Error granting access:', err);
      setError(err?.message || 'Failed to grant pro access');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAccess = async (email) => {
    if (!confirm(`Are you sure you want to revoke pro access for ${email}?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase?.rpc('revoke_pro_access', {
        user_email: email
      });

      if (error) throw error;

      setSuccess(`Pro access revoked for ${email}`);
      await fetchPreauthorizedEmails();
    } catch (err) {
      console.error('Error revoking access:', err);
      setError(err?.message || 'Failed to revoke pro access');
    }
  };

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Icon name="Loader" size={24} className="animate-spin" color="var(--color-accent)" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect handled by useEffect, show nothing during redirect
  if (!user) {
    return null;
  }

  // Show access denied for authenticated but unauthorized users
  if (!isAuthorizedAdmin) {
    return (
      <>
        <Helmet>
          <title>Access Denied - Making It</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-16 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Icon name="ShieldAlert" size={64} color="var(--color-destructive)" className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-4">
                You do not have permission to access the admin panel. This area is restricted to authorized administrators only.
              </p>
              <Button onClick={() => navigate('/')} className="mt-4">
                <Icon name="Home" size={16} />
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Panel - Making It</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage pro user access and view analytics</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-border">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('user-management')}
                className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'user-management' ?'border-accent text-accent' :'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="Users" size={16} />
                  User Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'analytics' ?'border-accent text-accent' :'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="BarChart" size={16} />
                  Analytics
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
              <Icon name="AlertCircle" size={20} color="var(--color-destructive)" />
              <p className="text-destructive text-sm flex-1">{error}</p>
              <button onClick={() => setError(null)}>
                <Icon name="X" size={16} color="var(--color-destructive)" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-lg flex items-start gap-3">
              <Icon name="CheckCircle" size={20} color="var(--color-accent)" />
              <p className="text-accent text-sm flex-1">{success}</p>
              <button onClick={() => setSuccess(null)}>
                <Icon name="X" size={16} color="var(--color-accent)" />
              </button>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'user-management' && (
            <>
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Grant Access Form */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Icon name="UserPlus" size={24} color="var(--color-accent)" />
                    Grant Pro Access
                  </h2>
                  <form onSubmit={handleGrantAccess} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e?.target?.value)}
                        placeholder="user@example.com"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e?.target?.value)}
                        placeholder="Reason for granting access..."
                        rows={3}
                        disabled={submitting}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting || !newEmail?.trim()}
                      className="w-full"
                    >
                      {submitting ? (
                        <>
                          <Icon name="Loader" size={16} className="animate-spin" />
                          Granting Access...
                        </>
                      ) : (
                        <>
                          <Icon name="UserPlus" size={16} />
                          Grant Pro Access
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Current Stats */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Icon name="BarChart" size={24} color="var(--color-accent)" />
                    Access Statistics
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Preauthorized</p>
                        <p className="text-2xl font-bold">{preauthorizedEmails?.length || 0}</p>
                      </div>
                      <Icon name="Users" size={32} color="var(--color-accent)" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold text-accent">
                          {preauthorizedEmails?.filter(e => e?.status === 'active')?.length || 0}
                        </p>
                      </div>
                      <Icon name="CheckCircle" size={32} color="var(--color-accent)" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Revoked</p>
                        <p className="text-2xl font-bold text-muted-foreground">
                          {preauthorizedEmails?.filter(e => e?.status === 'revoked')?.length || 0}
                        </p>
                      </div>
                      <Icon name="XCircle" size={32} color="var(--color-muted-foreground)" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preauthorized Emails List */}
              <div className="mt-8 bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Icon name="List" size={24} color="var(--color-accent)" />
                  Preauthorized Emails
                </h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Icon name="Loader" size={32} color="var(--color-accent)" className="animate-spin" />
                  </div>
                ) : preauthorizedEmails?.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="Inbox" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
                    <p className="text-muted-foreground">No preauthorized emails yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Notes</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Added</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preauthorizedEmails?.map((item) => (
                          <tr key={item?.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Icon name="Mail" size={16} color="var(--color-accent)" />
                                <span className="font-medium">{item?.email}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  item?.status === 'active' ?'bg-accent/10 text-accent' :'bg-muted text-muted-foreground'
                                }`}
                              >
                                <Icon
                                  name={item?.status === 'active' ? 'CheckCircle' : 'XCircle'}
                                  size={12}
                                />
                                {item?.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                              {item?.notes || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(item?.created_at)?.toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item?.status === 'active' &&
                                !['travelbagbiggz2025@gmail.com', 'lewda3rd@gmail.com']?.includes(item?.email) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeAccess(item?.email)}
                                    iconName="UserMinus"
                                  >
                                    Revoke
                                  </Button>
                                )}
                              {['travelbagbiggz2025@gmail.com', 'lewda3rd@gmail.com']?.includes(item?.email) && (
                                <span className="text-xs text-muted-foreground">App Owner</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'analytics' && <AdminAnalytics />}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;