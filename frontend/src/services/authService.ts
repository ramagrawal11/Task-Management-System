import { apiService } from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User, ApiError } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.getClient().post<AuthResponse>('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Store token and user data
      apiService.setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async register(data: RegisterRequest): Promise<{ message: string }> {
    try {
      const response = await apiService.getClient().post<{ message: string }>('/auth/register', data);
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  async getUserProfile(): Promise<User> {
    try {
      const response = await apiService.getClient().get<User>('/auth/user');
      return response.data;
    } catch (error) {
      throw apiService.handleError(error);
    }
  },

  logout(): void {
    apiService.removeToken();
  },

  isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
    return null;
  }
};

