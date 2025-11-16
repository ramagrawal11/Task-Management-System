import type { TaskRow } from '../entities/taskEntity';

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

export class Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  tags: string[] | null;
  assignedTo: number | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;

  constructor(data: TaskRow) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status as TaskStatus;
    this.priority = data.priority as TaskPriority;
    this.dueDate = data.due_date;
    this.tags = this.parseTags(data.tags);
    this.assignedTo = data.assigned_to;
    this.createdBy = data.created_by;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.active = Boolean(data.active);
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
      assignedTo: this.assignedTo,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      active: this.active
    };
  }
}

