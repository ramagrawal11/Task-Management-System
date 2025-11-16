import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { taskService } from '../services/taskService';
import type { User, ApiError, TaskListResponse } from '../types';

export const UserProfile: React.FC = () => {
  const { user: contextUser, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [taskStats, setTaskStats] = useState<{
    assigned: number;
  }>({
    assigned: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const userProfile = await authService.getUserProfile();
        setProfile(userProfile);
        
        if (userProfile) {
          localStorage.setItem('user', JSON.stringify(userProfile));
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!contextUser?.id) {
        setStatsLoading(false);
        return;
      }

      setStatsLoading(true);
      try {
        const assignedResponse: TaskListResponse = await taskService.getAllTasks({
          assignedTo: contextUser.id,
          page: 1,
          limit: 1
        });

        setTaskStats({
          assigned: assignedResponse.pagination.total
        });
      } catch (err) {
        console.error('Failed to load task stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (contextUser) {
      fetchTaskStats();
    }
  }, [contextUser]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <Link to="/tasks" style={styles.backLink}>
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  const displayUser = profile || contextUser;

  if (!displayUser) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Profile not found</div>
        <Link to="/tasks" style={styles.backLink}>
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/tasks" style={styles.backLink}>
          ← Back to Tasks
        </Link>
        <div style={styles.headerActions}>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div style={styles.errorBanner}>
          {error}
        </div>
      )}

      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {getInitials(displayUser.fullName)}
          </div>
          <div style={styles.profileInfo}>
            <h1 style={styles.profileName}>{displayUser.fullName}</h1>
            <p style={styles.profileEmail}>{displayUser.email}</p>
          </div>
        </div>

        {!statsLoading && (
          <div style={styles.statsSection}>
            <h2 style={styles.sectionTitle}>Statistics</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{taskStats.assigned}</div>
                <div style={styles.statLabel}>Assigned to Me</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{displayUser.id}</div>
                <div style={styles.statLabel}>User ID</div>
              </div>
            </div>
          </div>
        )}

        <div style={styles.detailsSection}>
          <h2 style={styles.sectionTitle}>Account Details</h2>
          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Email</span>
              <span style={styles.detailValue}>{displayUser.email}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Full Name</span>
              <span style={styles.detailValue}>{displayUser.fullName}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>User ID</span>
              <span style={styles.detailValue}>{displayUser.id}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Member Since</span>
              <span style={styles.detailValue}>
                {formatDate(displayUser.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  header: {
    maxWidth: '1000px',
    margin: '0 auto 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
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
  errorBanner: {
    maxWidth: '1000px',
    margin: '0 auto 20px',
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px'
  },
  profileCard: {
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '40px',
    paddingBottom: '30px',
    borderBottom: '2px solid #eee'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  },
  profileEmail: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '0'
  },
  statsSection: {
    marginBottom: '40px',
    paddingBottom: '30px',
    borderBottom: '2px solid #eee'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #dee2e6'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  detailsSection: {
    marginBottom: '0',
    paddingBottom: '0'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  detailLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  detailValue: {
    fontSize: '16px',
    color: '#333'
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
  }
};

