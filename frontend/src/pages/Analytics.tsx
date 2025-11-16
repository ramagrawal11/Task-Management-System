import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import type {
  TaskOverviewResponse,
  UserPerformanceResponse,
  ApiError
} from '../types';

export const Analytics: React.FC = () => {
  const { user, logout } = useAuth();

  const [overview, setOverview] = useState<TaskOverviewResponse | null>(null);
  const [performance, setPerformance] = useState<UserPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const errors: string[] = [];

    try {
      try {
        const overviewData = await analyticsService.getTaskOverview();
        setOverview(overviewData);
      } catch (err) {
        const apiError = err as ApiError;
        errors.push(`Failed to load task overview: ${apiError.message || 'Unknown error'}`);
        console.error('Error fetching task overview:', err);
      }

      try {
        const performanceData = await analyticsService.getUserPerformance(user.id);
        setPerformance(performanceData);
      } catch (err) {
        const apiError = err as ApiError;
        errors.push(`Failed to load performance metrics: ${apiError.message || 'Unknown error'}`);
        console.error('Error fetching user performance:', err);
      }

      if (errors.length === 2) {
        setError(errors.join('. '));
      } else if (errors.length > 0) {
        setError(`Some data could not be loaded: ${errors.join('. ')}`);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await analyticsService.exportTasks();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to export tasks');
    } finally {
      setExporting(false);
    }
  };

  const renderStatusChart = () => {
    if (!overview) return null;

    const statusData = Object.entries(overview.statistics.byStatus);
    const maxValue = Math.max(...statusData.map(([, count]) => count), 1);
    const total = overview.statistics.total;

    return (
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Tasks by Status</h3>
        <div style={styles.barChart}>
          {statusData.map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const barHeight = total > 0 ? (count / maxValue) * 100 : 0;
            
            return (
              <div key={status} style={styles.barItem}>
                <div style={styles.barWrapper}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${barHeight}%`,
                      backgroundColor: getStatusColor(status)
                    }}
                  >
                    <span style={styles.barValue}>{count}</span>
                  </div>
                </div>
                <div style={styles.barLabel}>{status.replace('_', ' ').toUpperCase()}</div>
                <div style={styles.barPercentage}>{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPriorityChart = () => {
    if (!overview) return null;

    const priorityData = Object.entries(overview.statistics.byPriority);
    const maxValue = Math.max(...priorityData.map(([, count]) => count), 1);
    const total = overview.statistics.total;

    return (
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Tasks by Priority</h3>
        <div style={styles.barChart}>
          {priorityData.map(([priority, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const barHeight = total > 0 ? (count / maxValue) * 100 : 0;
            
            return (
              <div key={priority} style={styles.barItem}>
                <div style={styles.barWrapper}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${barHeight}%`,
                      backgroundColor: getPriorityColor(priority)
                    }}
                  >
                    <span style={styles.barValue}>{count}</span>
                  </div>
                </div>
                <div style={styles.barLabel}>{priority.toUpperCase()}</div>
                <div style={styles.barPercentage}>{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'in_progress':
        return '#007bff';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      default:
        return '#28a745';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  if (error && !overview && !performance) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <Link to="/tasks" style={styles.backLink}>
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Task Management System</h1>
          <p style={styles.subtitle}>Analytics Dashboard</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={handleExport} disabled={exporting} style={{ ...styles.exportButton, ...(exporting ? styles.buttonDisabled : {}) }}>
            {exporting ? 'Exporting...' : '📥 Export Tasks'}
          </button>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <Link to="/tasks" style={styles.backLink}>
          ← Back to Tasks
        </Link>

        {error && (
          <div style={styles.errorBanner}>
            {error}
          </div>
        )}

        <div style={styles.toolbar}>
          <h2 style={styles.pageTitle}>Analytics Dashboard</h2>
        </div>

        {/* Task Overview */}
        {overview && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Task Overview</h2>
            <div style={styles.chartsGrid}>
              {renderStatusChart()}
              {renderPriorityChart()}
            </div>
          </div>
        )}

        {/* User Performance */}
        {performance && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Performance</h2>
            <div style={styles.performanceGrid}>
              <div style={styles.performanceCard}>
                <div style={styles.performanceValue}>{performance.metrics.tasksCreated}</div>
                <div style={styles.performanceLabel}>Tasks Created</div>
              </div>
              <div style={styles.performanceCard}>
                <div style={styles.performanceValue}>{performance.metrics.tasksAssigned}</div>
                <div style={styles.performanceLabel}>Tasks Assigned</div>
              </div>
              <div style={styles.performanceCard}>
                <div style={styles.performanceValue}>{performance.metrics.tasksCompleted}</div>
                <div style={styles.performanceLabel}>Tasks Completed</div>
              </div>
              <div style={styles.performanceCard}>
                <div style={styles.performanceValue}>{performance.metrics.completionRate.toFixed(1)}%</div>
                <div style={styles.performanceLabel}>Completion Rate</div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0 0'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  backLink: {
    display: 'inline-block',
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '20px',
    padding: '8px 0',
    transition: 'color 0.2s'
  },
  exportButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px'
  },
  toolbar: {
    marginBottom: '20px'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  errorBanner: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px'
  },
  overviewCards: {
    marginBottom: '30px'
  },
  statCard: {
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #dee2e6',
    maxWidth: '300px'
  },
  statValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '16px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  chartContainer: {
    width: '100%'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
    textAlign: 'center'
  },
  barChart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '200px',
    gap: '15px',
    padding: '15px 0'
  },
  barItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  barWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  bar: {
    width: '80%',
    minHeight: '40px',
    position: 'relative',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'height 0.3s ease'
  },
  barValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '12px',
    position: 'absolute',
    top: '-18px'
  },
  barLabel: {
    fontSize: '11px',
    color: '#666',
    fontWeight: '500',
    textAlign: 'center'
  },
  barPercentage: {
    fontSize: '10px',
    color: '#999',
    textAlign: 'center'
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  performanceCard: {
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #dee2e6'
  },
  performanceValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '8px'
  },
  performanceLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666'
  },
  error: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    textAlign: 'center'
  },
};

