// src/api/teamUsers.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface CreateUserData {
  email: string;
  full_name: string;
  role: string;
  send_welcome_email: boolean;
}

interface UpdateUserData {
  full_name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}

export const teamUsersApi = {
  // Get team statistics
  getStats: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/api/v1/admin/team/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get all team users
  getAll: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/api/v1/admin/team/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get single user
  getById: async (id: number) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/api/v1/admin/team/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Create new user
  create: async (data: CreateUserData) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/api/v1/admin/team/users`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Update user
  update: async (id: number, data: UpdateUserData) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.patch(
      `${API_URL}/api/v1/admin/team/users/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Toggle user status
  toggle: async (id: number) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.patch(
      `${API_URL}/api/v1/admin/team/users/${id}/toggle`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Reset password
  resetPassword: async (id: number) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/api/v1/admin/team/users/${id}/reset-password`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Delete user
  delete: async (id: number) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.delete(
      `${API_URL}/api/v1/admin/team/users/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
