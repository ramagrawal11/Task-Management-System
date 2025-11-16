export type UserRow = {
  id: number;
  email: string;
  full_name: string;
  password_hash: string;
  created_at: Date;
  active: number;
};

export type UserProfileRow = {
  id: number;
  email: string;
  fullName: string;
  createdAt: Date;
  active: number;
};

export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
};

