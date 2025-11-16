import { apiService } from './api';
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskListResponse, ApiError } from '../types';

export const taskService = {
  async getAllTasks(params?: {
    status?: string;
    priority?: string;
    assignedTo?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<TaskListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      queryParams.append('page', (params?.page || 1).toString());
      queryParams.append('limit', (params?.limit || 10).toString());

      const response = await apiService.getClient().get<TaskListResponse>(
        `/tasks?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async getTaskById(id: number): Promise<Task> {
    try {
      const response = await apiService.getClient().get<Task>(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async createTask(data: CreateTaskRequest): Promise<Task> {
    try {
      const response = await apiService.getClient().post<Task>('/tasks', data);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    try {
      const response = await apiService.getClient().put<Task>(`/tasks/${id}`, data);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async deleteTask(id: number): Promise<{ message: string }> {
    try {
      const response = await apiService.getClient().delete<{ message: string }>(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }
};

