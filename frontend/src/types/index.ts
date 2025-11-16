export interface User {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
  active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[] | null;
  assignedTo: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  assignedTo?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  assignedTo?: number;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content?: string;
}

export interface CommentsResponse {
  comments: Comment[];
}

export interface FileAttachment {
  id: number;
  taskId: number;
  userId: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string | null;
  downloadUrl: string | null;
  createdAt: string;
  active: boolean;
}

export interface FilesResponse {
  files: FileAttachment[];
}

export interface UploadFilesResponse {
  message: string;
  files: FileAttachment[];
  errors?: string[];
}

export interface TaskStatistics {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface TaskOverviewResponse {
  statistics: TaskStatistics;
}

export interface UserPerformanceMetrics {
  userId: number;
  totalTasks: number;
  tasksCreated: number;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
}

export interface UserPerformanceResponse {
  metrics: UserPerformanceMetrics;
}


