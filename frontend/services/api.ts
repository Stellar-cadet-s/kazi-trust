import { User, JobListing, AuthResponse, PaginatedResponse } from '@/types';
import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_BASE_URL = API_BASE.replace(/\/$/, '') + '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit & { skipAuth?: boolean }): Promise<T> {
  const { skipAuth, ...rest } = options || {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  const token = getToken();
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers,
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = (data as { detail?: string; [k: string]: unknown }) || {};
    throw new Error(err.detail || err.error || (typeof err === 'object' && err !== null ? JSON.stringify(err) : text || 'Request failed'));
  }

  return data as T;
}

export const authService = {
  login: (emailOrPhone: string, password: string) =>
    fetchAPI<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(
        emailOrPhone.includes('@') ? { email: emailOrPhone, password } : { phone_number: emailOrPhone, password }
      ),
      skipAuth: true,
    }),

  register: (data: {
    email?: string;
    password: string;
    phone_number: string;
    first_name?: string;
    last_name?: string;
    user_type: 'employer' | 'employee';
  }) =>
    fetchAPI<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email || undefined,
        password: data.password,
        phone_number: data.phone_number,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        user_type: data.user_type,
      }),
      skipAuth: true,
    }),
};

export interface WorkHistoryItem {
  job_title: string;
  employer_name: string | null;
  completed_at: string | null;
  duration_days: number;
  work_summary: string | null;
}

export interface JobApplicant {
  id: number;
  employee: number;
  employee_name: string;
  employee_phone: string;
  employee_email: string | null;
  status: string;
  created_at: string;
  work_history?: WorkHistoryItem[];
}

export interface EscrowInfo {
  job_id: number;
  job_title: string;
  contract_id: string;
  amount_held: string;
  amount_held_kes: string;
  amount_held_xlm: string;
  status: string;
  funded_at: string | null;
  released_at: string | null;
  when_release: string | null;
}

export interface PaystackInit {
  reference: string;
  amount_kobo: number;
  amount_kes: number;
  currency: string;
  email: string;
  job_id: number;
  job_title: string;
}

export interface TransactionItem {
  type: 'deposit' | 'payout';
  id: number;
  job_id: number;
  job_title: string;
  amount: string;
  currency: string;
  reference: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export const jobService = {
  list: () =>
    fetchAPI<JobListing[]>('/jobs/').then((res) => (Array.isArray(res) ? res : (res as PaginatedResponse<JobListing>).data || (res as PaginatedResponse<JobListing>).results || [])),

  get: (id: number | string) =>
    fetchAPI<JobListing>(`/jobs/${id}/`),

  create: (data: { title: string; description: string; budget: string }) =>
    fetchAPI<JobListing>('/jobs/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number | string, data: { employee_id?: number; applicant_id?: number; status?: string }) =>
    fetchAPI<JobListing>(`/jobs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  apply: (id: number | string) =>
    fetchAPI<{ message: string; application_id: number }>(`/jobs/${id}/apply/`, {
      method: 'POST',
    }),

  withdrawApplication: (id: number | string) =>
    fetchAPI<{ message: string }>(`/jobs/${id}/withdraw-application/`, {
      method: 'POST',
    }),

  applicants: (id: number | string) =>
    fetchAPI<JobApplicant[]>(`/jobs/${id}/applicants/`),

  initiatePaystack: (id: number | string) =>
    fetchAPI<PaystackInit>(`/jobs/${id}/initiate-paystack/`, {
      method: 'POST',
    }),

  escrow: (id: number | string) =>
    fetchAPI<EscrowInfo>(`/jobs/${id}/escrow/`),

  complete: (id: number | string, data?: { work_summary?: string }) =>
    fetchAPI<{ message: string; job_id: number }>(`/jobs/${id}/complete/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
};

export const transactionService = {
  list: () => fetchAPI<TransactionItem[]>('/transactions/'),
};

export interface HiredWorker {
  job_id: number;
  job_title: string;
  employee_id: number;
  employee_name: string;
  employee_phone: string;
  assigned_at: string | null;
  completed_at: string | null;
  status: string;
  duration_days: number;
}

export interface JobApplicantSummary {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_phone: string;
  work_history?: WorkHistoryItem[];
}

export interface OpenJobWithApplicants {
  job_id: number;
  job_title: string;
  applicant_count: number;
  applicants: JobApplicantSummary[];
}

export const employerService = {
  workersOverview: () =>
    fetchAPI<{ hired_workers: HiredWorker[]; open_jobs_with_applicants: OpenJobWithApplicants[] }>(
      '/employer/workers-overview/'
    ),
};

export interface MyApplication {
  job_id: number;
  application_id: number;
  status: string;
}

export interface WorkHistoryEntry {
  job_id: number;
  job_title: string;
  employer_name: string | null;
  completed_at: string | null;
  duration_days: number;
  work_summary: string | null;
  budget: string;
}

export const employeeService = {
  myApplications: () => fetchAPI<MyApplication[]>('/employee/my-applications/'),
  workHistory: () => fetchAPI<WorkHistoryEntry[]>('/employee/work-history/'),
};

export interface ChatJob {
  job_id: number;
  job_title: string;
  other_name: string;
  status: string;
}

export interface JobMessageItem {
  id: number;
  sender_id: number;
  sender_name: string;
  is_mine: boolean;
  text: string;
  created_at: string;
}

export const chatService = {
  listChats: () => fetchAPI<ChatJob[]>('/chats/'),
  getMessages: (jobId: number | string) => fetchAPI<JobMessageItem[]>(`/jobs/${jobId}/messages/`),
  sendMessage: (jobId: number | string, text: string) =>
    fetchAPI<JobMessageItem>(`/jobs/${jobId}/messages/`, { method: 'POST', body: JSON.stringify({ text }) }),
};
