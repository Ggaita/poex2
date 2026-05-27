import { NavLink, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getAuthSession,
  getDefaultPrivateRoute,
  type AuthRole
} from "../shared/auth/session";
import "./PrivateLayout.css";

type Props = {
  children: React.ReactNode;
};

type NavItem = {
  to: string;
  label: string;
};

const navByRole: Record<AuthRole, NavItem[]> = {
  admin: [
    { to: "/admin/dashboard", label: "Panel admin" },
    { to: "/admin/applications", label: "Solicitudes" }
  ],
  empresa: [{ to: "/empresa/panel", label: "Panel empresa" }]
};

export default function PrivateLayout({ children }: Props) {
  const navigate = useNavigate();
  const session = getAuthSession();
  const role: AuthRole = session?.role === "admin" ? "admin" : "empresa";
  const links = navByRole[role];
  const displayName = session?.displayName ?? "Usuario";

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
            <span>{role === "admin" ? "Área Administrativa" : "Área Empresa"}</span>
          </div>

          <div className="private-session">
            <small>{displayName}</small>
            <button type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

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
      </header>

      <main className="main-content private-main-content">{children}</main>

      <footer className="private-footer">
        <p>
          {role === "admin"
            ? "Área interna de administración · Gestión y moderación"
            : "Área interna de empresa · Gestión de cuenta y solicitudes"}
        </p>
      </footer>
    </div>
  );
}
