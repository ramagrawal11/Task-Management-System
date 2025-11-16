import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { TaskStatus, TaskPriority } from '../types';
import type { CreateTaskRequest, UpdateTaskRequest, ApiError } from '../types';
import '../styles/login.css';

export const TaskForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    tags: [],
    assignedTo: undefined
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (isEditing && id) {
      const fetchTask = async () => {
        try {
          const task = await taskService.getTaskById(parseInt(id, 10));
          
          // Convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
          let dueDateFormatted = '';
          if (task.dueDate) {
            const date = new Date(task.dueDate);
            // Format: YYYY-MM-DDTHH:mm (datetime-local format)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            dueDateFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;
          }
          
          setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: dueDateFormatted,
            tags: task.tags || [],
            assignedTo: task.assignedTo || undefined
          });
        } catch (err) {
          const apiError = err as ApiError;
          setError(apiError.message || 'Failed to load task');
        } finally {
          setFetching(false);
        }
      };

      fetchTask();
    }
  }, [id, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert datetime-local format to ISO string if provided
      let dueDate = formData.dueDate;
      if (dueDate) {
        // Convert from datetime-local format (YYYY-MM-DDTHH:mm) to ISO string
        const date = new Date(dueDate);
        dueDate = date.toISOString();
      }

      if (isEditing && id) {
        const updateData: UpdateTaskRequest = {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          dueDate: dueDate || undefined,
          tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
          assignedTo: formData.assignedTo || undefined
        };
        await taskService.updateTask(parseInt(id, 10), updateData);
        navigate(`/tasks/${id}`);
      } else {
        const createData: CreateTaskRequest = {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          dueDate: dueDate || undefined,
          tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
          assignedTo: formData.assignedTo || undefined
        };
        const newTask = await taskService.createTask(createData);
        navigate(`/tasks/${newTask.id}`);
      }
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors && apiError.errors.length > 0) {
        const fieldErrors: { [key: string]: string } = {};
        apiError.errors.forEach((err) => {
          if (err.field) {
            fieldErrors[err.field] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setError(apiError.message || `${isEditing ? 'Failed to update' : 'Failed to create'} task`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading task...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to={isEditing && id ? `/tasks/${id}` : '/tasks'} style={styles.backLink}>
          ← Back {isEditing ? 'to Task' : 'to Tasks'}
        </Link>
      </div>

      <div style={styles.card}>
        <h1 style={styles.title}>{isEditing ? 'Edit Task' : 'Create New Task'}</h1>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="title" style={styles.label}>
              Title <span style={styles.required}>*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className={errors.title ? 'input-error' : loading ? 'input-disabled' : ''}
              style={styles.input}
              placeholder="Enter task title"
              disabled={loading}
            />
            {errors.title && (
              <span style={styles.errorText}>{errors.title}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="description" style={styles.label}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className={loading ? 'input-disabled' : ''}
              style={styles.textarea}
              placeholder="Enter task description"
              disabled={loading}
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="status" style={styles.label}>
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={loading ? 'input-disabled' : ''}
                style={styles.select}
                disabled={loading}
              >
                {Object.values(TaskStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="priority" style={styles.label}>
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={loading ? 'input-disabled' : ''}
                style={styles.select}
                disabled={loading}
              >
                {Object.values(TaskPriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="dueDate" style={styles.label}>
              Due Date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleChange}
              className={loading ? 'input-disabled' : ''}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="assignedTo" style={styles.label}>
              Assigned To (User ID)
            </label>
            <input
              id="assignedTo"
              name="assignedTo"
              type="number"
              value={formData.assignedTo || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  assignedTo: value ? parseInt(value, 10) : undefined
                }));
              }}
              className={loading ? 'input-disabled' : ''}
              style={styles.input}
              placeholder="Enter user ID"
              disabled={loading}
            />
            <small style={styles.helpText}>
              Leave empty to keep unassigned. Enter user ID to assign task.
            </small>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="tagInput" style={styles.label}>
              Tags
            </label>
            <div style={styles.tagInputContainer}>
              <input
                id="tagInput"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className={loading ? 'input-disabled' : ''}
                style={styles.input}
                placeholder="Enter tag and press Enter"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
                style={{
                  ...styles.tagButton,
                  ...(loading || !tagInput.trim() ? styles.buttonDisabled : {})
                }}
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div style={styles.tags}>
                {formData.tags.map((tag, index) => (
                  <span key={index} style={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      disabled={loading}
                      style={styles.tagRemove}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              style={{
                ...styles.cancelButton,
                ...(loading ? styles.buttonDisabled : {})
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                ...(loading ? styles.buttonDisabled : {})
              }}
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
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
    maxWidth: '800px',
    margin: '0 auto 20px'
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
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  required: {
    color: '#dc3545'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  select: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  helpText: {
    color: '#666',
    fontSize: '12px',
    marginTop: '-4px'
  },
  errorText: {
    color: '#c33',
    fontSize: '12px'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  tagInputContainer: {
    display: 'flex',
    gap: '8px'
  },
  tagButton: {
    padding: '12px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px'
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#e9ecef',
    color: '#495057',
    borderRadius: '4px',
    fontSize: '14px'
  },
  tagRemove: {
    background: 'none',
    border: 'none',
    color: '#495057',
    cursor: 'pointer',
    fontSize: '18px',
    padding: 0,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
    paddingTop: '24px',
    borderTop: '1px solid #eee'
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666'
  }
};

