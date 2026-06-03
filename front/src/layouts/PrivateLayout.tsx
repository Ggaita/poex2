import { NavLink, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getAuthSession,
  getDefaultPrivateRoute,
  type AuthRole
} from "../shared/auth/session";
import type { LayoutProps, NavItem } from "./layout.types";
import "./PrivateLayout.css";

const navByRole: Record<AuthRole, NavItem[]> = {
  admin: [
    { to: "/admin/dashboard", label: "Panel admin" },
    { to: "/admin/applications", label: "Solicitudes" },
    { to: "/admin/profiles", label: "Perfiles" }
  ],
  empresa: [{ to: "/empresa/panel", label: "Panel empresa" }]
};

export default function PrivateLayout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const session = getAuthSession();
  const isAuthenticated = Boolean(session?.token);
  const role: AuthRole | null = session?.token ? session.role : null;
  const links = role ? navByRole[role] : [];
  const displayName = session?.displayName ?? "";

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

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
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "private-nav-link active" : "private-nav-link"
                }
                end={link.to === getDefaultPrivateRoute(role)}
              >
                {link.label}
              </NavLink>
            ))}
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
