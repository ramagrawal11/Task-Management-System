import type { FileRow } from '../entities/fileEntity';

export class File {
  id: number;
  taskId: number;
  userId: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string | null;
  s3Key: string;
  createdAt: Date;
  active: boolean;

  constructor(data: FileRow) {
    this.id = data.id;
    this.taskId = data.task_id;
    this.userId = data.user_id;
    this.fileName = data.file_name;
    this.originalName = data.original_name;
    this.fileSize = data.file_size;
    this.mimeType = data.mime_type;
    this.s3Key = data.s3_key;
    this.createdAt = data.created_at;
    this.active = Boolean(data.active);
  }

  toJSON(downloadUrl?: string) {
    return {
      id: this.id,
      taskId: this.taskId,
      userId: this.userId,
      fileName: this.fileName,
      originalName: this.originalName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      downloadUrl: downloadUrl || null,
      createdAt: this.createdAt.toISOString(),
      active: this.active
    };
  }
}

