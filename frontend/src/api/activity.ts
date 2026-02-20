// src/api/activity.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const activityApi = {
  getDashboard: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/api/v1/activity/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getRecentActivity: async (limit: number = 20) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/api/v1/activity/recent?limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
