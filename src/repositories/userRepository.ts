import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { UserModel } from '../models/userModel';
import type { UserRow } from '../entities/userEntity';

export class UserRepository {
  async findByEmail(email: string): Promise<UserModel | null> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<(UserRow & RowDataPacket)[]>(
        'SELECT id, email, password_hash, full_name, created_at, active FROM users WHERE email = ?',
        [email]
      );
      return rows.length > 0 ? new UserModel(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findById(id: number): Promise<UserModel | null> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<(UserRow & RowDataPacket)[]>(
        'SELECT id, email, password_hash, full_name, created_at, active FROM users WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? new UserModel(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findProfileById(id: number): Promise<UserModel | null> {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<(UserRow & RowDataPacket)[]>(
        'SELECT id, email, full_name, created_at, active FROM users WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? new UserModel(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async create(data: { email: string; passwordHash: string; fullName: string }): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.query(
        'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
        [data.email, data.passwordHash, data.fullName]
      );
    } finally {
      connection.release();
    }
  }

  async findByIds(ids: number[]): Promise<UserModel[]> {
    if (ids.length === 0) {
      return [];
    }

    const connection = await pool.getConnection();

    try {
      const placeholders = ids.map(() => '?').join(',');
      const [rows] = await connection.query<(UserRow & RowDataPacket)[]>(
        `SELECT id, email, password_hash, full_name, created_at, active FROM users WHERE id IN (${placeholders})`,
        ids
      );
      return rows.map(row => new UserModel(row));
    } finally {
      connection.release();
    }
  }
}

export const userRepository = new UserRepository();

