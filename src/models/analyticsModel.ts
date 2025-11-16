import type { TaskStatistics, UserPerformanceMetrics, TaskExportRow } from '../entities/analyticsEntity';

export class TaskStatisticsModel {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;

  constructor(data: TaskStatistics) {
  this.total = data.total;
    this.byStatus = data.byStatus;
    this.byPriority = data.byPriority;
  }

  toJSON() {
    return {
      total: this.total,
      byStatus: this.byStatus,
      byPriority: this.byPriority
    };
  }
}

export class UserPerformanceMetricsModel {
  userId: number;
  totalTasks: number;
  tasksCreated: number;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;

  constructor(data: UserPerformanceMetrics) {
    this.userId = data.userId;
    this.totalTasks = data.totalTasks;
    this.tasksCreated = data.tasksCreated;
    this.tasksAssigned = data.tasksAssigned;
    this.tasksCompleted = data.tasksCompleted;
    this.completionRate = data.completionRate;
    this.tasksByStatus = data.tasksByStatus;
    this.tasksByPriority = data.tasksByPriority;
  }

  toJSON() {
    return {
      userId: this.userId,
      totalTasks: this.totalTasks,
      tasksCreated: this.tasksCreated,
      tasksAssigned: this.tasksAssigned,
      tasksCompleted: this.tasksCompleted,
      completionRate: this.completionRate,
      tasksByStatus: this.tasksByStatus,
      tasksByPriority: this.tasksByPriority
    };
  }
}

export class TaskExportRowModel {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  createdByEmail: string | null;
  createdByName: string | null;
  assignedToEmail: string | null;
  assignedToName: string | null;

  constructor(data: TaskExportRow) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.priority = data.priority;
    this.dueDate = data.due_date;
    this.tags = this.parseTags(data.tags);
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.createdByEmail = data.created_by_email;
    this.createdByName = data.created_by_name;
    this.assignedToEmail = data.assigned_to_email;
    this.assignedToName = data.assigned_to_name;
  }

  private parseTags(tags: string | null): string[] | null {
    if (!tags) return null;
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate ? this.dueDate.toISOString() : null,
      tags: this.tags,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      createdByEmail: this.createdByEmail,
      createdByName: this.createdByName,
      assignedToEmail: this.assignedToEmail,
      assignedToName: this.assignedToName
    };
  }

  toCSVRow(): string[] {
    return [
      this.id.toString(),
      this.title,
      this.description || '',
      this.status,
      this.priority,
      this.dueDate ? this.dueDate.toISOString() : '',
      this.tags ? this.tags.join('; ') : '',
      this.createdAt.toISOString(),
      this.updatedAt.toISOString(),
      this.createdByEmail || '',
      this.createdByName || '',
      this.assignedToEmail || '',
      this.assignedToName || ''
    ];
  }

  static getCSVHeaders(): string[] {
    return [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Due Date',
      'Tags',
      'Created At',
      'Updated At',
      'Created By Email',
      'Created By Name',
      'Assigned To Email',
      'Assigned To Name'
    ];
  }
}

