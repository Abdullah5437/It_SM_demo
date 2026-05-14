// Common application types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export type UserRole = 'admin' | 'accounts' | 'support' | 'sales' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
}
