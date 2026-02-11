// src/api/candidates.ts
import api from './axios';
import type { Candidate } from '../types';

export interface CreateCandidateData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  current_company?: string;
  current_designation?: string;
  total_experience?: number;
  skills?: string[];
  current_location?: string;
  preferred_locations?: string[];
  notice_period_days?: number;
  current_ctc?: number;
  expected_ctc?: number;
  currency?: string;
  source?: string;
}

export interface UpdateCandidateData extends Partial<CreateCandidateData> {}

export interface CandidatesListResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const candidatesApi = {
  // Get all candidates
  getCandidates: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    skills?: string;
    min_experience?: number;
    max_experience?: number;
  }): Promise<CandidatesListResponse> => {
    const response = await api.get<CandidatesListResponse>('/candidates', { params });
    return response.data;
  },

  // Get single candidate
  getCandidate: async (id: number): Promise<Candidate> => {
    const response = await api.get<Candidate>(`/candidates/${id}`);
    return response.data;
  },

  // Create candidate
  createCandidate: async (data: CreateCandidateData): Promise<Candidate> => {
    const response = await api.post<Candidate>('/candidates', data);
    return response.data;
  },

  // Update candidate
  updateCandidate: async (id: number, data: UpdateCandidateData): Promise<Candidate> => {
    const response = await api.put<Candidate>(`/candidates/${id}`, data);
    return response.data;
  },

  // Delete candidate
  deleteCandidate: async (id: number): Promise<void> => {
    await api.delete(`/candidates/${id}`);
  },

  // Upload resume (placeholder - to be implemented)
  uploadResume: async (id: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/candidates/${id}/upload-resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
