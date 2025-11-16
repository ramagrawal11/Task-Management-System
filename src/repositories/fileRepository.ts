import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { File } from '../models/fileModel';
import type { FileRow, CreateFileInput } from '../entities/fileEntity';

export class FileRepository {
  async create(data: CreateFileInput & { taskId: number; userId: number }): Promise<File> {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        `INSERT INTO files (task_id, user_id, file_name, original_name, file_size, mime_type, s3_key)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.taskId,
          data.userId,
          data.fileName,
          data.originalName,
          data.fileSize,
          data.mimeType || null,
          data.s3Key
        ]
      );

      const insertResult = result as { insertId: number };
      const fileId = insertResult.insertId;

      const [rows] = await connection.query<(FileRow & RowDataPacket)[]>(
        `SELECT id, task_id, user_id, file_name, original_name, file_size, mime_type, s3_key, created_at, deleted_at, active
         FROM files WHERE id = ?`,
        [fileId]
      );

      if (rows.length === 0) {
        throw new Error('Failed to retrieve created file');
      }

      return new File(rows[0]);
    } finally {
      connection.release();
    }
  }

  async findById(id: number): Promise<File | null> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<(FileRow & RowDataPacket)[]>(
        `SELECT id, task_id, user_id, file_name, original_name, file_size, mime_type, s3_key, created_at, deleted_at, active
         FROM files
         WHERE id = ? AND active = 1`,
        [id]
      );

      return rows.length > 0 ? new File(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findByTaskId(taskId: number): Promise<File[]> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<(FileRow & RowDataPacket)[]>(
        `SELECT id, task_id, user_id, file_name, original_name, file_size, mime_type, s3_key, created_at, deleted_at, active
         FROM files
         WHERE task_id = ? AND active = 1
         ORDER BY created_at DESC`,
        [taskId]
      );

      return rows.map(row => new File(row));
    } finally {
      connection.release();
    }
  }

  async softDelete(id: number): Promise<void> {
    const connection = await pool.getConnection();

    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('File not found');
      }

      await connection.query('UPDATE files SET deleted_at = NOW(), active = 0 WHERE id = ?', [id]);
    } finally {
      connection.release();
    }
  }
}

export const fileRepository = new FileRepository();

