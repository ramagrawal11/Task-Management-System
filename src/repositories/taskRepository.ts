import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { Task, TaskStatus, TaskPriority } from '../models/taskModel';
import type {
  TaskRow,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskSortOptions,
  PaginationOptions
} from '../entities/taskEntity';

export class TaskRepository {
  async create(data: CreateTaskInput & { createdBy: number }): Promise<Task> {
    const connection = await pool.getConnection();

    try {
      const tagsJson = data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null;
      const dueDateValue = data.dueDate ? new Date(data.dueDate) : null;
      const [result] = await connection.query(
        `INSERT INTO tasks (title, description, status, priority, due_date, tags, assigned_to, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          data.description || null,
          data.status || TaskStatus.PENDING,
          data.priority || TaskPriority.MEDIUM,
          dueDateValue,
          tagsJson,
          data.assignedTo || null,
          data.createdBy
        ]
      );

      const insertResult = result as { insertId: number };
      const taskId = insertResult.insertId;

      const [rows] = await connection.query<(TaskRow & RowDataPacket)[]>(
        `SELECT id, title, description, status, priority, due_date, tags, assigned_to, created_by, created_at, updated_at, deleted_at, active
         FROM tasks WHERE id = ?`,
        [taskId]
      );

      if (rows.length === 0) {
        throw new Error('Failed to retrieve created task');
      }

      return new Task(rows[0]);
    } finally {
      connection.release();
    }
  }

  async findById(id: number): Promise<Task | null> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<(TaskRow & RowDataPacket)[]>(
        `SELECT id, title, description, status, priority, due_date, tags, assigned_to, created_by, created_at, updated_at, deleted_at, active
         FROM tasks
         WHERE id = ? AND active = 1`,
        [id]
      );

      return rows.length > 0 ? new Task(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findAll(
    filters: TaskFilters = {},
    sortOptions: TaskSortOptions = {},
    pagination: PaginationOptions = {}
  ): Promise<{ tasks: Task[]; total: number }> {
    const connection = await pool.getConnection();

    try {
      const conditions: string[] = ['active = 1'];
      const params: unknown[] = [];

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.priority) {
        conditions.push('priority = ?');
        params.push(filters.priority);
      }

      if (filters.assignedTo !== undefined) {
        conditions.push('assigned_to = ?');
        params.push(filters.assignedTo);
      }

      if (filters.search) {
        conditions.push('(title LIKE ? OR description LIKE ?)');
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const validSortFields = ['due_date'];
      const sortField = validSortFields.includes(sortOptions.sortBy || '') ? sortOptions.sortBy : 'due_date';
      const order = sortOptions.sortOrder === 'asc' ? 'ASC' : 'DESC';

      const pageNum = pagination.page || 1;
      const limitNum = pagination.limit || 10;
      const offset = (pageNum - 1) * limitNum;

      const [countRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM tasks ${whereClause}`,
        params
      );
      const total = (countRows[0] as { total: number }).total;

      const [rows] = await connection.query<(TaskRow & RowDataPacket)[]>(
        `SELECT id, title, description, status, priority, due_date, tags, assigned_to, created_by, created_at, updated_at, deleted_at, active
         FROM tasks
         ${whereClause}
         ORDER BY ${sortField} ${order}
         LIMIT ? OFFSET ?`,
        [...params, limitNum, offset]
      );

      return { tasks: rows.map(row => new Task(row)), total };
    } finally {
      connection.release();
    }
  }

  async update(id: number, data: UpdateTaskInput): Promise<Task> {
    const connection = await pool.getConnection();

    try {
 
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Task not found');
      }

      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        params.push(data.title);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description === '' ? null : data.description);
      }

      if (data.status !== undefined) {
        updates.push('status = ?');
        params.push(data.status);
      }

      if (data.priority !== undefined) {
        updates.push('priority = ?');
        params.push(data.priority);
      }

      if (data.dueDate !== undefined) {
        updates.push('due_date = ?');
        params.push(data.dueDate === '' || data.dueDate === null ? null : new Date(data.dueDate));
      }

      if (data.tags !== undefined) {
        updates.push('tags = ?');
        params.push(data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null);
      }

      if (data.assignedTo !== undefined) {
        updates.push('assigned_to = ?');
        params.push(data.assignedTo);
      }

      if (updates.length === 0) {
        throw new Error('No valid updates provided');
      }

      params.push(id);

      await connection.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);

      const [rows] = await connection.query<(TaskRow & RowDataPacket)[]>(
        `SELECT id, title, description, status, priority, due_date, tags, assigned_to, created_by, created_at, updated_at, deleted_at, active
         FROM tasks WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        throw new Error('Failed to retrieve updated task');
      }

      return new Task(rows[0]);
    } finally {
      connection.release();
    }
  }

  async softDelete(id: number): Promise<void> {
    const connection = await pool.getConnection();

    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Task not found');
      }

      await connection.query('UPDATE tasks SET deleted_at = NOW(), active = 0 WHERE id = ?', [id]);
    } finally {
      connection.release();
    }
  }

  async bulkCreate(data: CreateTaskInput[], createdBy: number): Promise<Task[]> {
    const connection = await pool.getConnection();

    try {
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (const task of data) {
        const tagsJson = task.tags && task.tags.length > 0 ? JSON.stringify(task.tags) : null;
        const dueDateValue = task.dueDate ? new Date(task.dueDate) : null;

        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
        values.push(
          task.title,
          task.description || null,
          task.status || TaskStatus.PENDING,
          task.priority || TaskPriority.MEDIUM,
          dueDateValue,
          tagsJson,
          task.assignedTo || null,
          createdBy
        );
      }

      await connection.query(
        `INSERT INTO tasks (title, description, status, priority, due_date, tags, assigned_to, created_by)
         VALUES ${placeholders.join(', ')}`,
        values
      );

      const [rows] = await connection.query<(TaskRow & RowDataPacket)[]>(
        `SELECT id, title, description, status, priority, due_date, tags, assigned_to, created_by, created_at, updated_at, deleted_at, active
         FROM tasks
         WHERE created_by = ? AND active = 1
         ORDER BY id DESC
         LIMIT ?`,
        [createdBy, data.length]
      );

      return rows.slice(0, data.length).reverse().map(row => new Task(row));
    } finally {
      connection.release();
    }
  }
}

export const taskRepository = new TaskRepository();

