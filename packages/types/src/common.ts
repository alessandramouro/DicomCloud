export type UUID = string;
export type ISODateString = string;

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  meta?: Record<string, unknown>;
  timestamp: ISODateString;
  requestId: string;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export type SortOrder = 'asc' | 'desc';

export interface DateRangeFilter {
  from?: ISODateString;
  to?: ISODateString;
}

export interface SearchFilter {
  q?: string;
}

export type Status = 'active' | 'inactive' | 'suspended' | 'pending';

export interface AuditInfo {
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt?: ISODateString | null;
  createdById?: UUID;
  updatedById?: UUID;
}
