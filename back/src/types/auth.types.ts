export type LoginRole = "admin" | "empresa";

export interface LoginInput {
  email: string;
  password: string;
  role: LoginRole;
}

export interface AuthUser {
  id: number;
  email: string;
  role: LoginRole;
  displayName: string;
}

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: LoginRole;
  displayName: string;
  iat?: number;
  exp?: number;
}
