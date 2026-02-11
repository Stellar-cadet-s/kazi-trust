// Matches Django backend API

export interface User {
  id: number;
  email: string | null;
  phone_number: string;
  first_name: string;
  last_name: string;
  user_type: 'employer' | 'employee';
}

export interface Worker extends User {
  user_type: 'employee';
}

// Backend: JobListing (we use as Contract in UI)
export interface JobListing {
  id: number;
  title: string;
  description: string;
  budget: string;
  status: JobStatus;
  employer: number;
  employer_name?: string;
  employee: number | null;
  created_at: string;
  updated_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  escrow_contract_id: string | null;
}

export type JobStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Legacy alias for UI
export type Contract = JobListing;

export interface ApiError {
  error?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  results?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}
