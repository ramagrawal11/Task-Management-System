import { apiService } from './api';
import type { Comment, CreateCommentRequest, UpdateCommentRequest, CommentsResponse, ApiError } from '../types';

export const commentService = {
  async getTaskComments(taskId: number): Promise<Comment[]> {
    try {
      const response = await apiService.getClient().get<CommentsResponse>(`/comments/tasks/${taskId}`);
      return response.data.comments;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async addComment(taskId: number, data: CreateCommentRequest): Promise<Comment> {
    try {
      const response = await apiService.getClient().post<Comment>(`/comments/tasks/${taskId}`, data);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async updateComment(commentId: number, data: UpdateCommentRequest): Promise<Comment> {
    try {
      const response = await apiService.getClient().put<Comment>(`/comments/${commentId}`, data);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async deleteComment(commentId: number): Promise<{ message: string }> {
    try {
      const response = await apiService.getClient().delete<{ message: string }>(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }
};

