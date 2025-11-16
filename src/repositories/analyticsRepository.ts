import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import type {
  TaskExportRow
} from '../entities/analyticsEntity';
import type { TaskRow } from '../entities/taskEntity';
import { userRepository } from './userRepository';

export class AnalyticsRepository {
  async getTasksForStatistics(userId: number): Promise<(TaskRow & RowDataPacket)[]> {
    const connection = await pool.getConnection();

    try {
      const [taskRows] = await connection.query<(TaskRow & RowDataPacket)[]>(
        `SELECT id, status, priority 
         FROM tasks 
         WHERE active = 1 AND created_by = ?`,
        [userId]
      );

      return taskRows;
    } finally {
      connection.release();
    }
  }

  async getUserTasksForMetrics(userId: number): Promise<(TaskRow & RowDataPacket)[] | null> {
    const connection = await pool.getConnection();

    try {
      const user = await userRepository.findById(userId);

      if (!user) {
        return null;
      }

      const [taskRows] = await connection.query<(TaskRow & RowDataPacket)[]>(
        `SELECT id, created_by, assigned_to, status, priority 
         FROM tasks 
         WHERE (created_by = ? OR assigned_to = ?) AND active = 1`,
        [userId, userId]
      );

      return taskRows;
    } finally {
      connection.release();
    }
  }

  async getAllTasksForExport(userId: number): Promise<(TaskExportRow & RowDataPacket)[]> {
    const connection = await pool.getConnection();

    try {
      const query = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date,
          t.tags,
          t.created_at,
          t.updated_at,
          u1.email as created_by_email,
          u1.full_name as created_by_name,
          u2.email as assigned_to_email,
          u2.full_name as assigned_to_name
        FROM tasks t
        LEFT JOIN users u1 ON t.created_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE t.active = 1 AND t.created_by = ?
        ORDER BY t.created_at DESC
      `;

      const params: unknown[] = [userId];

      const [rows] = await connection.query<(TaskExportRow & RowDataPacket)[]>(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }
}

export const analyticsRepository = new AnalyticsRepository();

