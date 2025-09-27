// Global type definitions

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: ApiError[];
}

// Common UI types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Feature flags
export interface FeatureFlags {
  enableNewDashboard: boolean;
  enableAdvancedSearch: boolean;
  enableNotifications: boolean;
}

// User permissions
export type Permission = 
  | 'user:read'
  | 'user:write'
  | 'user:delete'
  | 'product:read'
  | 'product:write'
  | 'product:delete'
  | 'order:read'
  | 'order:write'
  | 'order:delete'
  | 'admin:*';

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  primaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
}