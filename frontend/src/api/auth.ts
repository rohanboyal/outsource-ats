// src/api/auth.ts
import api from './axios';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../types';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await api.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // Register
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Refresh token
  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};
