export type CommentRow = {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  active: number;
};

export type CreateCommentInput = {
  content: string;
};

export type UpdateCommentInput = {
  content?: string;
};

