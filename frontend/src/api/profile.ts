// src/api/profile.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const profileApi = {
  getProfile: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateProfile: async (data: { full_name?: string; phone?: string }) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.patch(`${API_URL}/api/v1/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
  }) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/api/v1/profile/change-password`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
