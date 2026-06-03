import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getAuthSession,
  getDefaultPrivateRoute
} from "../../shared/auth/session";
import type { RequireRoleRouteProps } from "./require-role-route.types";

export default function RequireRoleRoute({
  allowedRoles
}: RequireRoleRouteProps) {
  const location = useLocation();
  const session = getAuthSession();

  if (!session || !session.token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!allowedRoles.includes(session.role)) {
    return <Navigate to={getDefaultPrivateRoute(session.role)} replace />;
  }

  return <Outlet />;
}
