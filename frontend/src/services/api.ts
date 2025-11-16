import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError } from '../types';

// In development, Vite proxy forwards /api requests to http://localhost:3000
// In production, set VITE_API_URL environment variable
const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add token to requests if available
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // If FormData, remove Content-Type header to let browser set it with boundary
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
      }
      
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        message: axiosError.message || 'An error occurred'
      };
    }
    return {
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

export const apiService = new ApiService();

