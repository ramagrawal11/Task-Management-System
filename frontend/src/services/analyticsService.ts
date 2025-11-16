import { apiService } from './api';
import type {
  TaskOverviewResponse,
  UserPerformanceResponse,
  ApiError
} from '../types';

export const analyticsService = {
  async getTaskOverview(): Promise<TaskOverviewResponse> {
    try {
      const response = await apiService.getClient().get<TaskOverviewResponse>('/analytics/tasks/overview');
      return response.data;
    } catch (error) {
      console.error('Analytics service error (getTaskOverview):', error);
      throw apiService.handleError(error);
    }
  },

  async getUserPerformance(userId: number): Promise<UserPerformanceResponse> {
    try {
      const response = await apiService.getClient().get<UserPerformanceResponse>(`/analytics/users/${userId}/performance`);
      return response.data;
    } catch (error) {
      console.error('Analytics service error (getUserPerformance):', error);
      throw apiService.handleError(error);
    }
  },

  async exportTasks(): Promise<Blob> {
    try {
      const response = await apiService.getClient().get('/analytics/tasks/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }
};

