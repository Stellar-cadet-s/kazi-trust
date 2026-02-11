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
    const err = (data as { detail?: string; error?: string; [k: string]: unknown }) || {};
    const errorMsg = err.detail || err.error || (typeof err === 'object' && err !== null ? JSON.stringify(err) : text || 'Request failed');
    throw new Error(errorMsg);
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

  update: (id: number | string, data: { employee_id?: number; status?: string }) =>
    fetchAPI<JobListing>(`/jobs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  complete: (id: number | string) =>
    fetchAPI<{ message: string; job_id: number }>(`/jobs/${id}/complete/`, {
      method: 'POST',
    }),
};
