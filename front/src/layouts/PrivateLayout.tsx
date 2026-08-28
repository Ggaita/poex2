import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getAuthSession,
  getDefaultPrivateRoute,
  type AuthRole
} from "../shared/auth/session";
import type { ApiResponse } from "../shared/types/api.types";
import type { LayoutProps, NavItem } from "./layout.types";
import "./PrivateLayout.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const BADGE_POLL_MS = 45_000;

const navByRole: Record<AuthRole, NavItem[]> = {
  admin: [
    { to: "/admin/dashboard", label: "Panel admin" },
    { to: "/admin/applications", label: "Solicitudes", badgeKey: "applications" },
    { to: "/admin/profiles", label: "Perfiles" },
    { to: "/admin/communications", label: "Comunicaciones" },
    {
      to: "/admin/special-requests",
      label: "Solicitudes de info",
      badgeKey: "specialRequests"
    },
    {
      to: "/admin/investment-opportunities",
      label: "Oportunidades",
      badgeKey: "investmentInquiries"
    }
  ],
  empresa: [{ to: "/empresa/panel", label: "Panel empresa" }]
};

type PendingBadgeCounts = {
  applications: number;
  specialRequests: number;
  investmentInquiries: number;
};

const formatBadgeCount = (count: number): string => {
  if (count > 99) {
    return "99+";
  }
  return String(count);
};

export default function PrivateLayout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAuthSession();
  const isAuthenticated = Boolean(session?.token);
  const role: AuthRole | null = session?.token ? session.role : null;
  const links = role ? navByRole[role] : [];
  const displayName = session?.displayName ?? "";
  const [pendingCounts, setPendingCounts] = useState<PendingBadgeCounts>({
    applications: 0,
    specialRequests: 0,
    investmentInquiries: 0
  });

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const loadPendingCounts = useCallback(async (): Promise<void> => {
    if (role !== "admin" || !session?.token) {
      setPendingCounts({ applications: 0, specialRequests: 0, investmentInquiries: 0 });
      return;
    }

    const headers = { Authorization: `Bearer ${session.token}` };

    try {
      const [applicationsResponse, specialRequestsResponse, investmentInquiriesResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/applications/pending-count`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/special-requests/pending-count`, { headers }),
          fetch(
            `${API_BASE_URL}/api/admin/investment-opportunities/inquiries/pending-count`,
            { headers }
          )
        ]);

      if (
        applicationsResponse.status === 401 ||
        specialRequestsResponse.status === 401 ||
        investmentInquiriesResponse.status === 401
      ) {
        clearAuthSession();
        navigate("/login", { replace: true });
        return;
      }

      const applicationsPayload =
        (await applicationsResponse.json()) as ApiResponse<{ count: number }>;
      const specialRequestsPayload =
        (await specialRequestsResponse.json()) as ApiResponse<{ count: number }>;
      const investmentInquiriesPayload =
        (await investmentInquiriesResponse.json()) as ApiResponse<{ count: number }>;

      setPendingCounts({
        applications:
          applicationsResponse.ok && applicationsPayload.success
            ? Math.max(0, Number(applicationsPayload.data?.count) || 0)
            : 0,
        specialRequests:
          specialRequestsResponse.ok && specialRequestsPayload.success
            ? Math.max(0, Number(specialRequestsPayload.data?.count) || 0)
            : 0,
        investmentInquiries:
          investmentInquiriesResponse.ok && investmentInquiriesPayload.success
            ? Math.max(0, Number(investmentInquiriesPayload.data?.count) || 0)
            : 0
      });
    } catch {
      // Keep last known counts if the badge poll fails.
    }
  }, [navigate, role, session?.token]);

  useEffect(() => {
    if (role !== "admin") {
      return;
    }

    void loadPendingCounts();
    const intervalId = window.setInterval(() => {
      void loadPendingCounts();
    }, BADGE_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadPendingCounts, location.pathname, role]);

  return (
    <div className="layout private-layout">
      <header className="private-header">
        <div className="private-header-row">
          <div className="private-brand">
            <strong>POEX</strong>
            <span>
              {role === "admin"
                ? "Área Administrativa"
                : role === "empresa"
                  ? "Área Empresa"
                  : "Acceso público"}
            </span>
          </div>
          {isAuthenticated ? (
            <div className="private-session">
              <small>{displayName}</small>
              <button type="button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>

        {isAuthenticated && role ? (
          <nav className="private-nav" aria-label="Navegación privada">
            {links.map((link) => {
              const badgeCount = link.badgeKey ? pendingCounts[link.badgeKey] : 0;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "private-nav-link active" : "private-nav-link"
                  }
                  end={link.to === getDefaultPrivateRoute(role)}
                >
                  <span className="private-nav-label">{link.label}</span>
                  {badgeCount > 0 ? (
                    <span className="private-nav-badge" aria-label={`${badgeCount} pendientes`}>
                      {formatBadgeCount(badgeCount)}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        ) : null}
      </header>

      <main className="main-content private-main-content">{children}</main>

      <footer className="private-footer">
        <p>
          {role === "admin"
            ? "Área interna de administración · Gestión y moderación"
            : role === "empresa"
              ? "Área interna de empresa · Gestión de cuenta y solicitudes"
              : "Portal público · Acceso e inscripción de empresas"}
        </p>
      </footer>
    </div>
  );
}
