import type { UserRow } from '../entities/userEntity';

export class UserModel {
  id: number;
  email: string;
  fullName: string;
  passwordHash: string;
  createdAt: Date;
  active: boolean;

  constructor(data: UserRow) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.full_name;
    this.passwordHash = data.password_hash;
    this.createdAt = data.created_at;
    this.active = Boolean(data.active);
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      createdAt: this.createdAt.toISOString(),
      active: this.active
    };
  }
}

