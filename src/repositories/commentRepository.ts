import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { Comment } from '../models/commentModel';
import type { CommentRow, CreateCommentInput, UpdateCommentInput } from '../entities/commentEntity';

export class CommentRepository {
  async create(data: CreateCommentInput & { taskId: number; userId: number }): Promise<Comment> {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        `INSERT INTO comments (task_id, user_id, content)
         VALUES (?, ?, ?)`,
        [data.taskId, data.userId, data.content]
      );

      const insertResult = result as { insertId: number };
      const commentId = insertResult.insertId;

      const [rows] = await connection.query<(CommentRow & RowDataPacket)[]>(
        `SELECT id, task_id, user_id, content, created_at, updated_at, deleted_at, active
         FROM comments WHERE id = ?`,
        [commentId]
      );

      if (rows.length === 0) {
        throw new Error('Failed to retrieve created comment');
      }

      return new Comment(rows[0]);
    } finally {
      connection.release();
    }
  }

  async findById(id: number): Promise<Comment | null> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<(CommentRow & RowDataPacket)[]>(
        `SELECT id, task_id, user_id, content, created_at, updated_at, deleted_at, active
         FROM comments
         WHERE id = ? AND active = 1`,
        [id]
      );

      return rows.length > 0 ? new Comment(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findByTaskId(taskId: number): Promise<Comment[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<(CommentRow & RowDataPacket)[]>(
        `SELECT id, task_id, user_id, content, created_at, updated_at, deleted_at, active
         FROM comments
         WHERE task_id = ? AND active = 1
         ORDER BY created_at ASC`,
        [taskId]
      );

      return rows.map(row => new Comment(row));
    } finally {
      connection.release();
    }
  }

  async update(id: number, data: UpdateCommentInput): Promise<Comment> {
    const connection = await pool.getConnection();

    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Comment not found');
      }

      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.content !== undefined) {
        updates.push('content = ?');
        params.push(data.content);
      }

      if (updates.length === 0) {
        throw new Error('No valid updates provided');
      }

      params.push(id);

      await connection.query(`UPDATE comments SET ${updates.join(', ')} WHERE id = ?`, params);

      const [rows] = await connection.query<(CommentRow & RowDataPacket)[]>(
        `SELECT id, task_id, user_id, content, created_at, updated_at, deleted_at, active
         FROM comments WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        throw new Error('Failed to retrieve updated comment');
      }

      return new Comment(rows[0]);
    } finally {
      connection.release();
    }
  }

  async softDelete(id: number): Promise<void> {
    const connection = await pool.getConnection();

    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Comment not found');
      }

      await connection.query('UPDATE comments SET deleted_at = NOW(), active = 0 WHERE id = ?', [id]);
    } finally {
      connection.release();
    }
  }
}

export const commentRepository = new CommentRepository();

