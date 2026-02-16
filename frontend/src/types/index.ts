// src/types/index.ts - CORRECTED TO MATCH YOUR EXACT BACKEND

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
// JOB DESCRIPTION TYPES - EXACT BACKEND MATCH
// ============================================================================

export type ContractType = 'full_time' | 'contract' | 'part_time' | 'temp_to_perm';
export type JDStatus = 'draft' | 'open' | 'on_hold' | 'closed';
export type JDPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface JD {
  id: number;
  jd_code: string;
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
  contract_type: ContractType;
  open_positions: number;
  filled_positions: number;
  status: JDStatus;
  priority: JDPriority;
  sla_days?: number;
  version: number;
  parent_jd_id?: number;
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  benefits?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Detail response extras
  total_applications?: number;
  active_applications?: number;
  submitted_applications?: number;
  interviewed_candidates?: number;
  offers_extended?: number;
  positions_filled?: number;
  remaining_positions?: number;
}

// Alias
export type JobDescription = JD;

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
  resume_path?: string;
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

  // Main fields
  designation: string;
  ctc_annual: number;
  base_salary?: number;
  variable_pay?: number;
  bonus?: number;
  benefits?: Record<string, any>;

  // Dates
  joining_date?: string;
  offer_valid_till?: string;  // ✅ Added

  // Additional fields
  work_location?: string;  // ✅ Added
  remarks?: string;  // ✅ Added

  // Status fields
  status: OfferStatus;
  sent_date?: string;
  accepted_date?: string;
  rejected_date?: string;

  // Versioning
  version: number;
  parent_offer_id?: number;
  revision_reason?: string;

  // Metadata
  created_by: number;
  created_at: string;
  updated_at: string;
}


// ============================================================================
// JOINING TYPES
// ============================================================================

export type JoiningStatus = 'confirmed' | 'no_show' | 'delayed' | 'replacement_required';

export interface Joining {
  id: number;
  application_id: number;
  offer_id: number;  // ✅ Added - required in your DB
  
  // Dates
  expected_joining_date: string;
  actual_joining_date?: string;
  
  // Employee details
  employee_id?: string;
  work_email?: string;  // ✅ Added
  reporting_manager?: string;  // ✅ Added
  
  // Status
  status: JoiningStatus;
  
  // No show info
  no_show_reason?: string;  // ✅ Added
  no_show_date?: string;  // ✅ Added
  
  // Replacement info
  replacement_window_days?: number;  // ✅ Added
  replacement_initiated?: number;  // ✅ Added (0 or 1)
  replacement_application_id?: number;  // ✅ Added
  
  // Documents & Onboarding
  documents_collected?: Record<string, any>;  // ✅ Changed from documents_submitted
  onboarding_status?: Record<string, any>;
  
  // BGV
  bgv_status?: string;  // ✅ Added
  bgv_completion_date?: string;  // ✅ Added
  
  // Notes
  replacement_reason?: string;  // ✅ Added
  remarks?: string;  // ✅ Added (called 'notes' in DB but schema uses 'remarks')
  
  // Metadata
  replacement_required: boolean;  // ✅ Added
  created_by: number;
  created_at: string;
  updated_at: string;
}


