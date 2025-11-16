export type FileRow = {
  id: number;
  task_id: number;
  user_id: number;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string | null;
  s3_key: string;
  created_at: Date;
  deleted_at: Date | null;
  active: number;
};

export type CreateFileInput = {
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType?: string;
  s3Key: string;
};

