import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { TaskStatus, TaskPriority } from '../types';
import type { Task, ApiError, TaskListResponse } from '../types';

export const Tasks: React.FC = () => {
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');

  const [sortBy, setSortBy] = useState<string>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(assignedToFilter && { assignedTo: parseInt(assignedToFilter, 10) }),
        sortBy,
        sortOrder,
        page: currentPage,
        limit
      };

      const response: TaskListResponse = await taskService.getAllTasks(params);
      setTasks(response.tasks);
      setPagination(response.pagination);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentPage, sortBy, sortOrder, statusFilter, priorityFilter, assignedToFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchTasks();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssignedToFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (field !== 'due_date') {
      return;
    }
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return '#28a745';
      case TaskStatus.IN_PROGRESS:
        return '#007bff';
      case TaskStatus.CANCELLED:
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.URGENT:
        return '#dc3545';
      case TaskPriority.HIGH:
        return '#fd7e14';
      case TaskPriority.MEDIUM:
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const hasActiveFilters = search || statusFilter || priorityFilter || assignedToFilter;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Task Management System</h1>
          <p style={styles.subtitle}>Welcome, {user?.fullName}</p>
        </div>
        <div style={styles.headerActions}>
          <Link to="/analytics" style={styles.analyticsLink}>
            Analytics
          </Link>
          <Link to="/profile" style={styles.profileLink}>
            Profile
          </Link>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.toolbar}>
          <h2 style={styles.pageTitle}>All Tasks</h2>
          <Link to="/tasks/new" style={styles.createButton}>
            + Create New Task
          </Link>
        </div>

        {!loading && (
          <div style={styles.totalTasksPanel}>
            <div style={styles.totalTasksContent}>
              <span style={styles.totalTasksLabel}>Total Tasks</span>
              <span style={styles.totalTasksValue}>{pagination.total}</span>
            </div>
          </div>
        )}

        <div style={styles.filters}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterRow}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.filterSelect}
            >
              <option value="">All Priorities</option>
              {Object.values(TaskPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority.toUpperCase()}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Assigned To (User ID)"
              value={assignedToFilter}
              onChange={(e) => {
                setAssignedToFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.filterInput}
            />

            {hasActiveFilters && (
              <button onClick={handleClearFilters} style={styles.clearButton}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={styles.empty}>
            <p>No tasks found.</p>
            <Link to="/tasks/new" style={styles.createLink}>
              Create your first task
            </Link>
          </div>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>
                      Title
                    </th>
                    <th style={styles.tableHeader}>
                      Status
                    </th>
                    <th style={styles.tableHeader}>
                      Priority
                    </th>
                    <th
                      style={styles.tableHeader}
                      onClick={() => handleSort('due_date')}
                      className="sortable"
                    >
                      Due Date {sortBy === 'due_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={styles.tableHeader}>Assigned To</th>
                    <th style={styles.tableHeader}>
                      Created
                    </th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      style={styles.tableRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={styles.tableCell}>
                        <div style={styles.taskTitle}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div style={styles.taskDescription}>
                            {task.description.length > 50
                              ? `${task.description.substring(0, 50)}...`
                              : task.description}
                          </div>
                        )}
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: getStatusColor(task.status),
                            color: 'white'
                          }}
                        >
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: getPriorityColor(task.priority),
                            color: 'white'
                          }}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {formatDate(task.dueDate)}
                      </td>
                      <td style={styles.tableCell}>
                        {task.assignedTo
                          ? `User ${task.assignedTo}${task.assignedTo === user?.id ? ' (You)' : ''}`
                          : 'Unassigned'}
                      </td>
                      <td style={styles.tableCell}>
                        {formatDate(task.createdAt)}
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.actions}>
                          <Link to={`/tasks/${task.id}`} style={styles.viewButton}>
                            View
                          </Link>
                          <Link to={`/tasks/${task.id}/edit`} style={styles.editButton}>
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  Previous
                </button>

                <div style={styles.paginationInfo}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total tasks)
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === pagination.totalPages ? styles.paginationButtonDisabled : {})
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
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
  analyticsLink: {
    padding: '8px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  profileLink: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
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
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  totalTasksPanel: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #dee2e6'
  },
  totalTasksContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalTasksLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  totalTasksValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff'
  },
  createButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500'
  },
  filters: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  searchContainer: {
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none'
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '150px'
  },
  filterInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    width: '200px'
  },
  clearButton: {
    padding: '10px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  createLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    marginTop: '12px',
    display: 'inline-block'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    padding: '16px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    fontWeight: '600',
    color: '#333',
    borderBottom: '2px solid #dee2e6',
    cursor: 'pointer',
    userSelect: 'none'
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
    transition: 'background-color 0.2s',
    backgroundColor: 'white'
  },
  tableCell: {
    padding: '16px',
    color: '#333'
  },
  taskTitle: {
    fontWeight: '500',
    fontSize: '16px',
    color: '#333'
  },
  taskDescription: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
    display: 'inline-block'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#17a2b8',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  paginationButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#666'
  }
};

if (!document.getElementById('tasks-page-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'tasks-page-styles';
  styleSheet.textContent = `
    .sortable {
      transition: background-color 0.2s;
    }
    .sortable:hover {
      background-color: #e9ecef !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
