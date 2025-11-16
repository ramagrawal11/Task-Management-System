import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { commentService } from '../services/commentService';
import { fileService } from '../services/fileService';
import { TaskStatus, TaskPriority } from '../types';
import type { Task, Comment, FileAttachment, ApiError } from '../types';

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Comment form state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  
  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) {
        setError('Task ID is required');
        setLoading(false);
        return;
      }

      try {
        const taskData = await taskService.getTaskById(parseInt(id, 10));
        setTask(taskData);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      setCommentsLoading(true);
      setCommentsError(null);

      try {
        const commentsData = await commentService.getTaskComments(parseInt(id, 10));
        setComments(commentsData);
      } catch (err) {
        const apiError = err as ApiError;
        setCommentsError(apiError.message || 'Failed to load comments');
      } finally {
        setCommentsLoading(false);
      }
    };

    if (task) {
      fetchComments();
    }
  }, [id, task]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!id) return;

      setFilesLoading(true);
      setFilesError(null);

      try {
        const filesData = await fileService.getTaskFiles(parseInt(id, 10));
        setFiles(filesData);
      } catch (err) {
        const apiError = err as ApiError;
        setFilesError(apiError.message || 'Failed to load files');
      } finally {
        setFilesLoading(false);
      }
    };

    if (task) {
      fetchFiles();
    }
  }, [id, task]);

  const handleDelete = async () => {
    if (!task || !window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setDeleting(true);
    try {
      await taskService.deleteTask(task.id);
      navigate('/tasks');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCommentDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id || submittingComment) return;

    setSubmittingComment(true);
    try {
      const comment = await commentService.addComment(parseInt(id, 10), {
        content: newComment.trim()
      });
      setComments([...comments, comment]);
      setNewComment('');
      setCommentsError(null);
    } catch (err) {
      const apiError = err as ApiError;
      setCommentsError(apiError.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editCommentContent.trim()) return;

    try {
      const updatedComment = await commentService.updateComment(commentId, {
        content: editCommentContent.trim()
      });
      setComments(comments.map(c => c.id === commentId ? updatedComment : c));
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (err) {
      const apiError = err as ApiError;
      setCommentsError(apiError.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentService.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      const apiError = err as ApiError;
      setCommentsError(apiError.message || 'Failed to delete comment');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setFilesError(null);
    }
  };

  const handleUploadFiles = async () => {
    if (!id || selectedFiles.length === 0 || uploadingFiles) return;

    setUploadingFiles(true);
    setUploadProgress('Uploading files...');
    setFilesError(null);

    try {
      const response = await fileService.uploadFiles(parseInt(id, 10), selectedFiles);
      setFiles([...files, ...response.files]);
      setSelectedFiles([]);
      setUploadProgress(`Successfully uploaded ${response.files.length} file(s)`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (err) {
      const apiError = err as ApiError;
      setFilesError(apiError.message || 'Failed to upload files');
      setUploadProgress('');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await fileService.deleteFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err) {
      const apiError = err as ApiError;
      setFilesError(apiError.message || 'Failed to delete file');
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading task...</div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <Link to="/tasks" style={styles.backLink}>
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Task not found</div>
        <Link to="/tasks" style={styles.backLink}>
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/tasks" style={styles.backLink}>
          ← Back to Tasks
        </Link>
        <div style={styles.actions}>
          <Link to="/profile" style={styles.profileLink}>
            Profile
          </Link>
          <Link to={`/tasks/${task.id}/edit`} style={styles.editButton}>
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              ...styles.deleteButton,
              ...(deleting ? styles.buttonDisabled : {})
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          {error}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.taskHeader}>
          <h1 style={styles.title}>{task.title}</h1>
          <div style={styles.badges}>
            <span
              style={{
                ...styles.badge,
                backgroundColor: getStatusColor(task.status),
                color: 'white'
              }}
            >
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
            <span
              style={{
                ...styles.badge,
                backgroundColor: getPriorityColor(task.priority),
                color: 'white'
              }}
            >
              {task.priority.toUpperCase()}
            </span>
          </div>
        </div>

        {task.description && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Description</h2>
            <p style={styles.description}>{task.description}</p>
          </div>
        )}

        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Due Date:</span>
            <span style={styles.detailValue}>
              {formatDate(task.dueDate)}
            </span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Created:</span>
            <span style={styles.detailValue}>
              {formatDate(task.createdAt)}
            </span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Last Updated:</span>
            <span style={styles.detailValue}>
              {formatDate(task.updatedAt)}
            </span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Created By:</span>
            <span style={styles.detailValue}>
              User ID: {task.createdBy}
              {task.createdBy === user?.id && ' (You)'}
            </span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Assigned To:</span>
            <span style={styles.detailValue}>
              {task.assignedTo
                ? `User ID: ${task.assignedTo}${task.assignedTo === user?.id ? ' (You)' : ''}`
                : 'Unassigned'}
            </span>
          </div>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Tags</h2>
            <div style={styles.tags}>
              {task.tags.map((tag, index) => (
                <span key={index} style={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.commentsCard}>
        <h2 style={styles.sectionTitle}>Comments ({comments.length})</h2>

        {commentsError && (
          <div style={styles.errorBanner}>
            {commentsError}
          </div>
        )}

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} style={styles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            style={styles.commentTextarea}
            disabled={submittingComment}
            required
          />
          <button
            type="submit"
            disabled={submittingComment || !newComment.trim()}
            style={{
              ...styles.commentSubmitButton,
              ...(submittingComment || !newComment.trim() ? styles.buttonDisabled : {})
            }}
          >
            {submittingComment ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        {/* Comments List */}
        {commentsLoading ? (
          <div style={styles.commentsLoading}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={styles.noComments}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div style={styles.commentsList}>
            {comments.map((comment) => (
              <div key={comment.id} style={styles.commentItem}>
                {editingCommentId === comment.id ? (
                  <div style={styles.commentEditForm}>
                    <textarea
                      value={editCommentContent}
                      onChange={(e) => setEditCommentContent(e.target.value)}
                      rows={3}
                      style={styles.commentTextarea}
                      required
                    />
                    <div style={styles.commentEditActions}>
                      <button
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={!editCommentContent.trim()}
                        style={{
                          ...styles.commentSaveButton,
                          ...(!editCommentContent.trim() ? styles.buttonDisabled : {})
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={styles.commentCancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={styles.commentHeader}>
                      <div>
                        <span style={styles.commentAuthor}>
                          User ID: {comment.userId}
                          {comment.userId === user?.id && ' (You)'}
                          {comment.updatedAt !== comment.createdAt && ' (edited)'}
                        </span>
                      </div>
                      {comment.userId === user?.id && (
                        <div style={styles.commentActions}>
                          <button
                            onClick={() => handleEditComment(comment)}
                            style={styles.commentEditButton}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            style={styles.commentDeleteButton}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={styles.commentContent}>{comment.content}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.filesCard}>
        <h2 style={styles.sectionTitle}>Files ({files.length})</h2>

        {filesError && (
          <div style={styles.errorBanner}>
            {filesError}
          </div>
        )}

        {uploadProgress && (
          <div style={styles.successBanner}>
            {uploadProgress}
          </div>
        )}

        {/* File Upload Form */}
        <div style={styles.fileUploadSection}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            accept=".csv,.doc,.docx,.jpg,.jpeg,.png,.mp4"
            style={{ display: 'none' }}
            disabled={uploadingFiles}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFiles}
            style={{
              ...styles.fileSelectButton,
              ...(uploadingFiles ? styles.buttonDisabled : {})
            }}
          >
            Choose Files
          </button>

          {selectedFiles.length > 0 && (
            <div style={styles.selectedFiles}>
              <p style={styles.selectedFilesTitle}>Selected files ({selectedFiles.length}):</p>
              {selectedFiles.map((file, index) => (
                <div key={index} style={styles.selectedFileItem}>
                  <span style={styles.selectedFileName}>
                    {file.name} ({fileService.formatFileSize(file.size)})
                  </span>
                  <button
                    onClick={() => handleRemoveSelectedFile(index)}
                    disabled={uploadingFiles}
                    style={styles.removeFileButton}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={handleUploadFiles}
                disabled={uploadingFiles}
                style={{
                  ...styles.uploadButton,
                  ...(uploadingFiles ? styles.buttonDisabled : {})
                }}
              >
                {uploadingFiles ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
              </button>
            </div>
          )}

          <p style={styles.fileInfo}>
            Allowed file types: CSV, Images (JPEG, PNG), Word documents (DOC, DOCX), Videos (MP4). Max size: 10MB per file.
          </p>
        </div>
        
        {filesLoading ? (
          <div style={styles.filesLoading}>Loading files...</div>
        ) : files.length === 0 ? (
          <div style={styles.noFiles}>
            No files attached yet.
          </div>
        ) : (
          <div style={styles.filesList}>
            {files.map((file) => (
              <div key={file.id} style={styles.fileItem}>
                <div style={styles.fileInfoRow}>
                  <div style={styles.fileIconName}>
                    <div>
                      <a
                        href={file.downloadUrl || '#'}
                        download={file.originalName}
                        style={styles.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {file.originalName}
                      </a>
                      <div style={styles.fileMeta}>
                        {fileService.formatFileSize(file.fileSize)} • User ID: {file.userId}
                        {file.userId === user?.id && ' (You)'} • {formatCommentDate(file.createdAt)}
                      </div>
                    </div>
                  </div>
                  {file.userId === user?.id && (
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      style={styles.fileDeleteButton}
                      title="Delete file"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  profileLink: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  editButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500'
  },
  deleteButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  errorBanner: {
    maxWidth: '1000px',
    margin: '0 auto 20px',
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px'
  },
  card: {
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  taskHeader: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #eee'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px'
  },
  badges: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  badge: {
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px'
  },
  description: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#666',
    whiteSpace: 'pre-wrap'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
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
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    padding: '6px 12px',
    backgroundColor: '#e9ecef',
    color: '#495057',
    borderRadius: '4px',
    fontSize: '14px'
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
  commentsCard: {
    maxWidth: '1000px',
    margin: '20px auto 0',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  commentForm: {
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '2px solid #eee'
  },
  commentTextarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    marginBottom: '12px',
    transition: 'border-color 0.2s'
  },
  commentSubmitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  commentsLoading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666'
  },
  noComments: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontStyle: 'italic'
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  commentItem: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    borderLeft: '3px solid #007bff'
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  },
  commentAuthor: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginRight: '12px'
  },
  commentDate: {
    fontSize: '12px',
    color: '#999'
  },
  commentActions: {
    display: 'flex',
    gap: '8px'
  },
  commentEditButton: {
    padding: '4px 8px',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  commentDeleteButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  commentContent: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  },
  commentEditForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  commentEditActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  commentSaveButton: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  commentCancelButton: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  filesCard: {
    maxWidth: '1000px',
    margin: '20px auto 0',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  fileUploadSection: {
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '2px solid #eee'
  },
  fileSelectButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '16px'
  },
  selectedFiles: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  selectedFilesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px'
  },
  selectedFileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #dee2e6'
  },
  selectedFileName: {
    fontSize: '14px',
    color: '#333'
  },
  removeFileButton: {
    background: 'none',
    border: 'none',
    color: '#dc3545',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 8px'
  },
  uploadButton: {
    marginTop: '12px',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  fileInfo: {
    fontSize: '12px',
    color: '#666',
    marginTop: '12px',
    fontStyle: 'italic'
  },
  filesLoading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666'
  },
  noFiles: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontStyle: 'italic'
  },
  filesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  fileItem: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    borderLeft: '3px solid #007bff'
  },
  fileInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  fileIconName: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1
  },
  fileIcon: {
    fontSize: '24px',
    lineHeight: 1
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#007bff',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '4px'
  },
  fileMeta: {
    fontSize: '12px',
    color: '#666'
  },
  fileDeleteButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  successBanner: {
    maxWidth: '1000px',
    margin: '0 auto 20px',
    padding: '12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    fontSize: '14px'
  }
};

