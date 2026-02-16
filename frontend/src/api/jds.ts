// src/api/jds.ts - CORRECTED TO MATCH YOUR BACKEND
import api from './axios';
import type { JD, ContractType, JDStatus, JDPriority } from '../types';

export interface CreateJDData {
  client_id: number;
  pitch_id?: number;
  assigned_recruiter_id?: number;
  title: string;
  description: string;
  required_skills?: string[];
  preferred_skills?: string[];
  experience_min?: number;
  experience_max?: number;
  location?: string;
  work_mode?: string;
  contract_type?: ContractType;
  open_positions?: number;
  status?: JDStatus;
  priority?: JDPriority;
  sla_days?: number;
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  benefits?: string;
}

export interface UpdateJDData extends Partial<CreateJDData> {}

export interface JDsListResponse {
  job_descriptions: JD[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const jdsApi = {
  // Get all JDs
  getJDs: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    client_id?: number;
    status?: string;
    priority?: string;
    assigned_recruiter_id?: number;
    contract_type?: string;
    location?: string;
  }): Promise<JDsListResponse> => {
    const response = await api.get<JDsListResponse>('/jds', { params });
    return response.data;
  },

  // Get single JD
  getJD: async (id: number): Promise<JD> => {
    const response = await api.get<JD>(`/jds/${id}`);
    return response.data;
  },

  // Create JD
  createJD: async (data: CreateJDData): Promise<JD> => {
    const response = await api.post<JD>('/jds', data);
    return response.data;
  },

  // Update JD
  updateJD: async (id: number, data: UpdateJDData): Promise<JD> => {
    const response = await api.put<JD>(`/jds/${id}`, data);
    return response.data;
  },

  // Update JD status
  updateStatus: async (id: number, status: JDStatus, notes?: string): Promise<JD> => {
    const response = await api.patch<JD>(`/jds/${id}/status`, { status, notes });
    return response.data;
  },

  // Assign JD to recruiter
  assignJD: async (id: number, recruiter_id: number): Promise<JD> => {
    const response = await api.post<JD>(`/jds/${id}/assign`, { recruiter_id });
    return response.data;
  },

  // Delete JD
  deleteJD: async (id: number, hard_delete: boolean = false): Promise<void> => {
    await api.delete(`/jds/${id}`, { params: { hard_delete } });
  },

  // Get JD applications
  getJDApplications: async (id: number, status?: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/jds/${id}/applications`, { 
      params: { status } 
    });
    return response.data;
  },
};
