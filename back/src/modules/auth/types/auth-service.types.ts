import type { AuthUser } from "../../../types/auth.types";

export type LoginError = "invalid_credentials" | "inactive_user";

export type LoginResult =
  | { user: AuthUser; error?: never }
  | { user?: never; error: LoginError };
