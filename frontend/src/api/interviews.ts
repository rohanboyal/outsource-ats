// src/api/interviews.ts
import api from './axios';
import type { Interview, InterviewStatus, InterviewResult, InterviewMode } from '../types';

export interface CreateInterviewData {
  application_id: number;
  round_number: number;
  round_name: string;
  scheduled_date?: string;
  duration_minutes: number;
  interviewer_name?: string;
  interviewer_email?: string;
  interview_mode: InterviewMode;
  meeting_link?: string;
  status?: InterviewStatus;
}

export interface UpdateInterviewData extends Partial<CreateInterviewData> {
  feedback?: string;
  rating?: number;
  result?: InterviewResult;
}

export interface InterviewsListResponse {
  interviews: Interview[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const interviewsApi = {
  // Get all interviews
  getInterviews: async (params?: {
    page?: number;
    page_size?: number;
    application_id?: number;
    status?: string;
    result?: string;
    scheduled_from?: string;
    scheduled_to?: string;
  }): Promise<InterviewsListResponse> => {
    const response = await api.get<InterviewsListResponse>('/interviews', { params });
    return response.data;
  },

  // Get single interview
  getInterview: async (id: number): Promise<Interview> => {
    const response = await api.get<Interview>(`/interviews/${id}`);
    return response.data;
  },

  // Create interview
  createInterview: async (data: CreateInterviewData): Promise<Interview> => {
    const response = await api.post<Interview>('/interviews', data);
    return response.data;
  },

  // Update interview
  updateInterview: async (id: number, data: UpdateInterviewData): Promise<Interview> => {
    const response = await api.put<Interview>(`/interviews/${id}`, data);
    return response.data;
  },

  // Update interview status
  updateStatus: async (id: number, status: InterviewStatus): Promise<Interview> => {
    const response = await api.patch<Interview>(`/interviews/${id}/status`, { status });
    return response.data;
  },

  // Submit feedback
  submitFeedback: async (id: number, feedback: string, rating?: number, result?: InterviewResult): Promise<Interview> => {
    const response = await api.post<Interview>(`/interviews/${id}/feedback`, {
      feedback,
      rating,
      result,
    });
    return response.data;
  },

  // Reschedule interview
  rescheduleInterview: async (id: number, scheduled_date: string, notes?: string): Promise<Interview> => {
    const response = await api.post<Interview>(`/interviews/${id}/reschedule`, {
      scheduled_date,
      notes,
    });
    return response.data;
  },

  // Delete interview
  deleteInterview: async (id: number): Promise<void> => {
    await api.delete(`/interviews/${id}`);
  },
};
