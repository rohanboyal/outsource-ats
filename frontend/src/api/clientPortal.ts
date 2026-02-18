// src/api/clientPortal.ts
import api from './axios';

export interface ClientDashboardStats {
  total_jds: number;
  open_jds: number;
  total_candidates_submitted: number;
  candidates_pending_review: number;
  interviews_scheduled: number;
  offers_extended: number;
  positions_filled: number;
}

export interface ClientJD {
  id: number;
  jd_code: string;
  title: string;
  status: string;
  priority: string;
  open_positions: number;
  filled_positions: number;
  total_applications: number;
  created_at: string;
}

export interface ClientCandidate {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  current_designation?: string;
  total_experience?: number;
  current_company?: string;
  skills?: string[];
  current_ctc?: number;
  expected_ctc?: number;
  notice_period_days?: number;
  application_status: string;
  jd_title: string;
  jd_id: number;
  submitted_date?: string;
  resume_path?: string;
  client_feedback?: string;
}

export interface ClientInterview {
  id: number;
  application_id: number;
  candidate_name: string;
  jd_title: string;
  round_name: string;
  round_number: number;
  scheduled_date?: string;
  interview_mode: string;
  meeting_link?: string;
  interviewer_name?: string;
  status: string;
  result?: string;
  feedback?: string;
}

export const clientPortalApi = {
  getDashboard: () =>
    api.get<ClientDashboardStats>('/client-portal/dashboard').then(r => r.data),

  getJDs: (status?: string) =>
    api.get<ClientJD[]>('/client-portal/jds', { params: { status } }).then(r => r.data),

  getCandidates: (params?: { jd_id?: number; status?: string }) =>
    api.get<ClientCandidate[]>('/client-portal/candidates', { params }).then(r => r.data),

  submitCandidateFeedback: (applicationId: number, data: {
    feedback: string;
    decision: 'approve' | 'reject' | 'hold';
    notes?: string;
  }) => api.post(`/client-portal/candidates/${applicationId}/feedback`, data).then(r => r.data),

  getInterviews: () =>
    api.get<ClientInterview[]>('/client-portal/interviews').then(r => r.data),

  submitInterviewFeedback: (interviewId: number, data: {
    feedback: string;
    rating?: number;
    result: 'selected' | 'rejected' | 'on_hold';
  }) => api.post(`/client-portal/interviews/${interviewId}/feedback`, data).then(r => r.data),
};

// Admin API for managing client users
export const clientUsersAdminApi = {
  createClientUser: (data: {
    client_id: number;
    email: string;
    full_name: string;
    password: string;
    send_welcome_email?: boolean;
  }) => api.post('/admin/client-users', data).then(r => r.data),

  listClientUsers: () =>
    api.get('/admin/client-users').then(r => r.data),

  toggleAccess: (userId: number) =>
    api.patch(`/admin/client-users/${userId}/toggle`).then(r => r.data),
};
