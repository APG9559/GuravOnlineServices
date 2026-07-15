export type Role = 'admin' | 'operator';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isFirstLogin: boolean;
  signature?: string;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  signature?: string;
  avatar?: string;
  createdAt: string;
}
