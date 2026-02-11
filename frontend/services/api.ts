import { User, Worker, Contract, AuthResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}

export const authService = {
  login: (email: string, password: string) =>
    fetchAPI<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string; phone: string; role: string }) =>
    fetchAPI<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    fetchAPI<User>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const workerService = {
  list: (params?: { search?: string; verified?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.verified !== undefined) searchParams.set('verified', String(params.verified));
    return fetchAPI<PaginatedResponse<Worker>>(`/api/workers?${searchParams}`);
  },

  get: (id: string) =>
    fetchAPI<Worker>(`/api/workers/${id}`),
};

export const contractService = {
  list: () =>
    fetchAPI<PaginatedResponse<Contract>>('/api/contracts'),

  get: (id: string) =>
    fetchAPI<Contract>(`/api/contracts/${id}`),

  create: (data: Partial<Contract>) =>
    fetchAPI<Contract>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: Contract['status']) =>
    fetchAPI<Contract>(`/api/contracts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const escrowService = {
  lock: (contractId: string, amount: number) =>
    fetchAPI('/api/escrow/lock', {
      method: 'POST',
      body: JSON.stringify({ contractId, amount }),
    }),

  release: (contractId: string) =>
    fetchAPI('/api/escrow/release', {
      method: 'POST',
      body: JSON.stringify({ contractId }),
    }),
};
