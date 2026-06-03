import type { AuthRole } from "../../shared/auth/session";

export type RequireRoleRouteProps = {
  allowedRoles: AuthRole[];
};
