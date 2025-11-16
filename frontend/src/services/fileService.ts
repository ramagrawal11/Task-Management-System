import { apiService } from './api';
import type { FileAttachment, FilesResponse, UploadFilesResponse } from '../types';

export const fileService = {
  async getTaskFiles(taskId: number): Promise<FileAttachment[]> {
    try {
      const response = await apiService.getClient().get<FilesResponse>(`/files/tasks/${taskId}`);
      return response.data.files;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async uploadFiles(taskId: number, files: FileList | File[]): Promise<UploadFilesResponse> {
    try {
      const formData = new FormData();
      
      const fileArray = Array.from(files);
      
      fileArray.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiService.getClient().post<UploadFilesResponse>(
        `/files/tasks/${taskId}`,
        formData
      );
      
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async deleteFile(fileId: number): Promise<{ message: string }> {
    try {
      const response = await apiService.getClient().delete<{ message: string }>(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
};

