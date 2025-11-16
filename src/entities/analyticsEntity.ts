export type TaskStatistics = {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
};

export type UserPerformanceMetrics = {
  userId: number;
  totalTasks: number;
  tasksCreated: number;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
};

export type TaskExportRow = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  tags: string | null;
  created_at: Date;
  updated_at: Date;
  created_by_email: string | null;
  created_by_name: string | null;
  assigned_to_email: string | null;
  assigned_to_name: string | null;
};

