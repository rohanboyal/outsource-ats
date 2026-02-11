// src/types/index.ts

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export type UserRole = 'admin' | 'recruiter' | 'account_manager' | 'bd_sales' | 'finance' | 'client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface Client {
  id: number;
  company_name: string;
  industry?: string;
  company_size?: string;
  website?: string;
  status: 'active' | 'inactive' | 'on_hold';
  default_sla_days?: number;
  billing_address?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientContact {
  id: number;
  client_id: number;
  name: string;
  designation?: string;
  email: string;
  phone?: string;
  is_primary: boolean;
}

// ============================================================================
// PITCH TYPES
// ============================================================================

export type PitchStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';

export interface Pitch {
  id: number;
  client_id: number;
  title: string;
  description: string;
  proposed_roles?: any[];
  rate_card?: Record<string, number>;
  expected_start_date?: string;
  expected_headcount?: number;
  status: PitchStatus;
  sent_date?: string;
  approved_date?: string;
  created_at: string;
}

// ============================================================================
// JOB DESCRIPTION TYPES
// ============================================================================

export interface JobDescription {
  id: number;
  jd_code: string;
  client_id: number;
  pitch_id?: number;
  title: string;
  description: string;
  required_skills?: string[];
  preferred_skills?: string[];
  experience_min?: number;
  experience_max?: number;
  location?: string;
  work_mode?: string;
  contract_type: 'full_time' | 'contract' | 'part_time' | 'temp_to_perm';
  open_positions: number;
  filled_positions: number;
  status: 'draft' | 'open' | 'on_hold' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CANDIDATE TYPES
// ============================================================================

export interface Candidate {
  id: number;
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
  created_at: string;
  updated_at: string;
}

// ============================================================================
// APPLICATION TYPES
// ============================================================================

export type ApplicationStatus = 
  | 'sourced'
  | 'screened'
  | 'submitted'
  | 'interviewing'
  | 'offered'
  | 'joined'
  | 'rejected'
  | 'withdrawn';

export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

export interface Application {
  id: number;
  candidate_id: number;
  jd_id: number;
  status: ApplicationStatus;
  sla_status?: SLAStatus;
  screening_notes?: string;
  internal_rating?: number;
  submitted_to_client_date?: string;
  sla_start_date?: string;
  sla_end_date?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INTERVIEW TYPES
// ============================================================================

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type InterviewResult = 'pending' | 'selected' | 'rejected' | 'on_hold';
export type InterviewMode = 'video' | 'phone' | 'in_person';

export interface Interview {
  id: number;
  application_id: number;
  round_number: number;
  round_name: string;
  scheduled_date?: string;
  duration_minutes: number;
  interviewer_name?: string;
  interviewer_email?: string;
  interview_mode: InterviewMode;
  meeting_link?: string;
  status: InterviewStatus;
  feedback?: string;
  rating?: number;
  result?: InterviewResult;
  created_at: string;
}

// ============================================================================
// OFFER TYPES
// ============================================================================

export type OfferStatus = 'draft' | 'sent' | 'negotiating' | 'accepted' | 'rejected' | 'expired' | 'superseded';

export interface Offer {
  id: number;
  offer_number: string;
  application_id: number;
  designation: string;
  annual_ctc: number;
  base_salary?: number;
  variable_pay?: number;
  bonus?: number;
  benefits?: Record<string, any>;
  joining_date?: string;
  status: OfferStatus;
  sent_date?: string;
  accepted_date?: string;
  created_at: string;
}

// ============================================================================
// JOINING TYPES
// ============================================================================

export type JoiningStatus = 'confirmed' | 'joined' | 'no_show' | 'delayed' | 'cancelled';

export interface Joining {
  id: number;
  application_id: number;
  expected_joining_date: string;
  actual_joining_date?: string;
  employee_id?: string;
  status: JoiningStatus;
  documents_submitted?: Record<string, boolean>;
  bgv_status?: string;
  onboarding_status?: Record<string, boolean>;
  created_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
