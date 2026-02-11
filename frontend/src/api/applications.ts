// src/api/applications.ts
import api from './axios';
import type { Application } from '../types';

export interface CreateApplicationData {
  candidate_id: number;
  jd_id: number;
  status?: 'sourced' | 'screened' | 'submitted' | 'interviewing' | 'offered' | 'joined' | 'rejected' | 'withdrawn';
  screening_notes?: string;
  internal_rating?: number;
}

export interface UpdateApplicationData extends Partial<CreateApplicationData> {}

export interface ApplicationsListResponse {
  applications: Application[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const applicationsApi = {
  // Get all applications
  getApplications: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    jd_id?: number;
    candidate_id?: number;
  }): Promise<ApplicationsListResponse> => {
    const response = await api.get<ApplicationsListResponse>('/applications', { params });
    return response.data;
  },

  // Get single application
  getApplication: async (id: number): Promise<Application> => {
    const response = await api.get<Application>(`/applications/${id}`);
    return response.data;
  },

  // Create application
  createApplication: async (data: CreateApplicationData): Promise<Application> => {
    const response = await api.post<Application>('/applications', data);
    return response.data;
  },

  // Update application
  updateApplication: async (id: number, data: UpdateApplicationData): Promise<Application> => {
    const response = await api.put<Application>(`/applications/${id}`, data);
    return response.data;
  },

  // Update status
  updateStatus: async (id: number, status: string, notes?: string): Promise<Application> => {
    const response = await api.patch<Application>(`/applications/${id}/status`, { status, notes });
    return response.data;
  },

  // Submit to client
  submitToClient: async (id: number, notes?: string): Promise<Application> => {
    const response = await api.post<Application>(`/applications/${id}/submit`, { submission_notes: notes });
    return response.data;
  },

  // Delete application
  deleteApplication: async (id: number): Promise<void> => {
    await api.delete(`/applications/${id}`);
  },

  // Get pipeline stats
  getPipelineStats: async (): Promise<any> => {
    const response = await api.get('/applications/stats/pipeline');
    return response.data;
  },
};
