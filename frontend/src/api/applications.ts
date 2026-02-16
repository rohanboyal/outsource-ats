// src/api/applications.ts
import api from './axios';
import type { Application, ApplicationStatus } from '../types';

export interface CreateApplicationData {
  candidate_id: number;
  jd_id: number;
  status?: ApplicationStatus;
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
    search?: string;
    jd_id?: number;
    candidate_id?: number;
    status?: string;
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
  updateStatus: async (id: number, status: ApplicationStatus): Promise<Application> => {
    const response = await api.patch<Application>(`/applications/${id}/status`, { status });
    return response.data;
  },

  // Submit to client
  submitToClient: async (id: number): Promise<Application> => {
    const response = await api.post<Application>(`/applications/${id}/submit`);
    return response.data;
  },

  // Delete application
  deleteApplication: async (id: number): Promise<void> => {
    await api.delete(`/applications/${id}`);
  },

  // Get pipeline stats
  getPipelineStats: async (): Promise<Record<ApplicationStatus, number>> => {
    const response = await api.get<Record<ApplicationStatus, number>>('/applications/stats/pipeline');
    return response.data;
  },
};