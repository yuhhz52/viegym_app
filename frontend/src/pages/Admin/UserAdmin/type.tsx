export interface RoleAssignmentInfo {
  roleName: string;
  assignedByName?: string;
  assignedByEmail?: string;
  assignedAt?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role?: string;
  roles?: string | string[];
  roleAssignments?: RoleAssignmentInfo[];
  fullName?: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserUpdateRequest {
  fullName?: string;
  password?: string;
  phone?: string;
  roles?: string[];
}

export interface UserCreationRequest {
  email: string;
  fullName?: string;
  password?: string;
  phone?: string;
  roles?: string[];
}

export interface PagingResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}
