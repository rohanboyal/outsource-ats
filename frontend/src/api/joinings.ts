// src/api/joinings.ts - FINAL CORRECT
import api from './axios';
import type { Joining, JoiningStatus } from '../types';

export interface CreateJoiningData {
  application_id: number;
  expected_joining_date: string;
  actual_joining_date?: string;
  employee_id?: string;
  status?: JoiningStatus;
  documents_submitted?: Record<string, boolean>;
  bgv_status?: string;
  bgv_completion_date?: string;
  onboarding_status?: Record<string, boolean>;
  replacement_reason?: string;
  remarks?: string;
}

export interface UpdateJoiningData extends Partial<CreateJoiningData> {
  replacement_required?: boolean;
}

export interface JoiningsListResponse {
  joinings: Joining[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const joiningsApi = {
  getJoinings: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<JoiningsListResponse> => {
    const response = await api.get<JoiningsListResponse>('/joinings', { params });
    return response.data;
  },

  getJoining: async (id: number): Promise<Joining> => {
    const response = await api.get<Joining>(`/joinings/${id}`);
    return response.data;
  },

  createJoining: async (data: CreateJoiningData): Promise<Joining> => {
    const response = await api.post<Joining>('/joinings', data);
    return response.data;
  },

  updateJoining: async (id: number, data: UpdateJoiningData): Promise<Joining> => {
    const response = await api.put<Joining>(`/joinings/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: JoiningStatus, notes?: string): Promise<Joining> => {
    const response = await api.patch<Joining>(`/joinings/${id}/status`, { status, notes });
    return response.data;
  },

  deleteJoining: async (id: number): Promise<void> => {
    await api.delete(`/joinings/${id}`);
  },
};
