export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'employer' | 'worker';
  verified: boolean;
  createdAt: string;
}

export interface Worker extends User {
  skills: string[];
  rating: number;
  reviewCount: number;
  location: string;
  bio: string;
}

export interface Contract {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  employerId: string;
  workerId?: string;
  startDate: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
