export type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  tags: string | null;
  assigned_to: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  active: number;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  tags?: string[];
  assignedTo?: number;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  tags?: string[];
  assignedTo?: number | null;
};

export type TaskFilters = {
  status?: string;
  priority?: string;
  assignedTo?: number;
  search?: string;
};

export type TaskSortOptions = {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginationOptions = {
  page?: number;
  limit?: number;
};

