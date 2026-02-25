import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const AdminAnalytics = () => {
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    completedSessions: 0,
    projectsCreated: 0,
    masteringExports: 0
  });
  const [exportLogs, setExportLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      setError(null);

      // Convert dates to ISO format if provided
      const startDateISO = startDate ? new Date(startDate)?.toISOString() : null;
      const endDateISO = endDate ? new Date(endDate)?.toISOString() : null;

      // Fetch all metrics in parallel
      const [activeUsersResult, completedSessionsResult, projectsResult, exportsResult, logsResult] = await Promise.all([
        supabase?.rpc('get_active_users_count', {
          start_date: startDateISO,
          end_date: endDateISO
        }),
        supabase?.rpc('get_completed_sessions_count', {
          start_date: startDateISO,
          end_date: endDateISO
        }),
        supabase?.rpc('get_projects_created_count', {
          start_date: startDateISO,
          end_date: endDateISO
        }),
        supabase?.rpc('get_mastering_exports_count', {
          start_date: startDateISO,
          end_date: endDateISO
        }),
        supabase?.rpc('get_export_logs_for_admin', {
          start_date: startDateISO,
          end_date: endDateISO,
          limit_count: 100
        })
      ]);

      // Check for errors
      if (activeUsersResult?.error) throw activeUsersResult?.error;
      if (completedSessionsResult?.error) throw completedSessionsResult?.error;
      if (projectsResult?.error) throw projectsResult?.error;
      if (exportsResult?.error) throw exportsResult?.error;
      if (logsResult?.error) throw logsResult?.error;

      setMetrics({
        activeUsers: activeUsersResult?.data || 0,
        completedSessions: completedSessionsResult?.data || 0,
        projectsCreated: projectsResult?.data || 0,
        masteringExports: exportsResult?.data || 0
      });

      setExportLogs(logsResult?.data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterApply = () => {
    if (dateRange?.startDate || dateRange?.endDate) {
      fetchAnalytics(dateRange?.startDate, dateRange?.endDate);
    } else {
      fetchAnalytics();
    }
  };

  const handleDateFilterReset = () => {
    setDateRange({ startDate: '', endDate: '' });
    fetchAnalytics();
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);

      // Prepare CSV data
      const headers = ['Date', 'User Email', 'Session Title', 'Action', 'Format', 'File Size (MB)', 'Status', 'Error Message'];
      const rows = exportLogs?.map(log => [
        format(new Date(log?.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log?.user_email || 'N/A',
        log?.session_title || 'N/A',
        log?.action || 'N/A',
        log?.export_format || 'N/A',
        log?.file_size ? (log?.file_size / (1024 * 1024))?.toFixed(2) : 'N/A',
        log?.status || 'N/A',
        log?.error_message || ''
      ]);

      // Create CSV content
      const csvContent = [
        headers?.join(','),
        ...rows?.map(row => row?.map(cell => `"${cell}"`)?.join(','))
      ]?.join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link?.setAttribute('href', url);
      link?.setAttribute('download', `export_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
      link.style.visibility = 'hidden';
      document.body?.appendChild(link);
      link?.click();
      document.body?.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV file');
    } finally {
      setExportingCsv(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb?.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Icon name="Loader" size={24} className="animate-spin" color="var(--color-accent)" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Track platform usage and export activity</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
          <Icon name="AlertCircle" size={20} color="var(--color-destructive)" />
          <p className="text-destructive text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <Icon name="X" size={16} color="var(--color-destructive)" />
          </button>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Calendar" size={20} color="var(--color-accent)" />
          Date Range Filter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="date"
            label="Start Date"
            value={dateRange?.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e?.target?.value })}
          />
          <Input
            type="date"
            label="End Date"
            value={dateRange?.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e?.target?.value })}
          />
          <div className="flex items-end gap-2">
            <Button onClick={handleDateFilterApply} className="flex-1">
              <Icon name="Filter" size={16} />
              Apply Filter
            </Button>
            <Button onClick={handleDateFilterReset} variant="outline">
              <Icon name="X" size={16} />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Icon name="Users" size={32} color="var(--color-accent)" />
            <div className="text-right">
              <p className="text-3xl font-bold">{metrics?.activeUsers}</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Active Users</h3>
          <p className="text-xs text-muted-foreground mt-1">Users with recorded sessions</p>
        </div>

        {/* Recording Sessions Completed */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Icon name="CheckCircle" size={32} color="var(--color-success)" />
            <div className="text-right">
              <p className="text-3xl font-bold">{metrics?.completedSessions}</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Sessions Completed</h3>
          <p className="text-xs text-muted-foreground mt-1">Recording sessions finished</p>
        </div>

        {/* Projects Created */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Icon name="FolderPlus" size={32} color="var(--color-warning)" />
            <div className="text-right">
              <p className="text-3xl font-bold">{metrics?.projectsCreated}</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Projects Created</h3>
          <p className="text-xs text-muted-foreground mt-1">Total audio sessions</p>
        </div>

        {/* Mastering Exports */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Icon name="Download" size={32} color="var(--color-error)" />
            <div className="text-right">
              <p className="text-3xl font-bold">{metrics?.masteringExports}</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Mastering Exports</h3>
          <p className="text-xs text-muted-foreground mt-1">Completed exports</p>
        </div>
      </div>

      {/* Export Logs Table */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon name="FileText" size={20} color="var(--color-accent)" />
            Export Logs
          </h3>
          <Button
            onClick={handleExportCsv}
            disabled={exportingCsv || exportLogs?.length === 0}
            variant="outline"
          >
            {exportingCsv ? (
              <>
                <Icon name="Loader" size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Icon name="Download" size={16} />
                Export CSV
              </>
            )}
          </Button>
        </div>

        {exportLogs?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="FileX" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-3" />
            <p className="text-muted-foreground">No export logs found</p>
            <p className="text-sm text-muted-foreground mt-1">Export logs will appear here once users export mastered tracks</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Session</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Format</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Size</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {exportLogs?.map((log) => (
                  <tr key={log?.id} className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-3 px-4 text-sm">
                      {format(new Date(log?.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="py-3 px-4 text-sm">{log?.user_email || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">{log?.session_title || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">{log?.action || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm uppercase">{log?.export_format || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">{formatFileSize(log?.file_size)}</td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          log?.status === 'success' ?'bg-success/10 text-success'
                            : log?.status === 'processing' ?'bg-warning/10 text-warning' :'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {log?.status === 'success' && <Icon name="CheckCircle" size={12} />}
                        {log?.status === 'processing' && <Icon name="Loader" size={12} className="animate-spin" />}
                        {log?.status === 'error' && <Icon name="XCircle" size={12} />}
                        {log?.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
