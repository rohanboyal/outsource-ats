// src/api/pitches.ts
import api from './axios';
import type { Pitch, PitchStatus } from '../types';

export interface CreatePitchData {
  client_id: number;
  pitch_title: string;
  description?: string;
  proposed_roles?: Array<Record<string, any>>;
  rate_card?: Record<string, any>;
  expected_headcount?: number;
  status?: PitchStatus;
  notes?: string;
}

export interface UpdatePitchData extends Partial<CreatePitchData> {}

export interface PitchesListResponse {
  pitches: Pitch[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const pitchesApi = {
  getPitches: async (params?: {
    page?: number;
    page_size?: number;
    client_id?: number;
    status?: string;
    search?: string;
  }): Promise<PitchesListResponse> => {
    const response = await api.get<PitchesListResponse>('/pitches', { params });
    return response.data;
  },

  getPitch: async (id: number): Promise<Pitch> => {
    const response = await api.get<Pitch>(`/pitches/${id}`);
    return response.data;
  },

  createPitch: async (data: CreatePitchData): Promise<Pitch> => {
    const response = await api.post<Pitch>('/pitches', data);
    return response.data;
  },

  updatePitch: async (id: number, data: UpdatePitchData): Promise<Pitch> => {
    const response = await api.put<Pitch>(`/pitches/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: PitchStatus, notes?: string): Promise<Pitch> => {
    const response = await api.patch<Pitch>(`/pitches/${id}/status`, { status, notes });
    return response.data;
  },

  sendPitch: async (id: number, notes?: string): Promise<Pitch> => {
    const response = await api.post<Pitch>(`/pitches/${id}/send`, { notes });
    return response.data;
  },

  approvePitch: async (id: number): Promise<Pitch> => {
    const response = await api.post<Pitch>(`/pitches/${id}/approve`);
    return response.data;
  },

  rejectPitch: async (id: number, rejection_reason: string): Promise<Pitch> => {
    const response = await api.post<Pitch>(`/pitches/${id}/reject`, { rejection_reason });
    return response.data;
  },

  deletePitch: async (id: number): Promise<void> => {
    await api.delete(`/pitches/${id}`);
  },
};
