import type { CommentRow } from '../entities/commentEntity';

export class Comment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;

  constructor(data: CommentRow) {
    this.id = data.id;
    this.taskId = data.task_id;
    this.userId = data.user_id;
    this.content = data.content;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.active = Boolean(data.active);
  }

  toJSON() {
    return {
      id: this.id,
      taskId: this.taskId,
      userId: this.userId,
      content: this.content,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      active: this.active
    };
  }
}

