import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PrivateLayout from "../../../layouts/PrivateLayout";
import {
  getAuthSession,
  getDefaultPrivateRoute,
  saveAuthSession
} from "../../../shared/auth/session";
import type { ApiResponse } from "../../../shared/types/api.types";
import type {
  LoginLocationState,
  LoginResponseData,
  LoginRole
} from "./login.types";
import "./LoginPage.css";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const resolveTargetRoute = (role: LoginRole, from?: string): string => {
  const defaultRoute = getDefaultPrivateRoute(role);
  if (!from || !from.startsWith("/")) {
    return defaultRoute;
  }

  if (role === "admin" && from.startsWith("/admin")) {
    return from;
  }

  if (role === "empresa" && from.startsWith("/empresa")) {
    return from;
  }

  return defaultRoute;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<LoginRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentSession = getAuthSession();
    if (!currentSession) {
      return;
    }

    navigate(getDefaultPrivateRoute(currentSession.role), { replace: true });
  }, [navigate]);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Completá email y contraseña.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Ingresá un email válido.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role
        })
      });

      const result = (await response.json()) as ApiResponse<LoginResponseData>;

      if (!response.ok) {
        setErrorMessage(result?.error ?? "No se pudo iniciar sesión.");
        return;
      }
      const token = result?.data?.token;

      const displayName = result?.data?.user?.displayName;
      const loggedUserRole = result?.data?.user?.role;
      const safeDisplayName = displayName || email.trim();

      if (
        typeof token !== "string" ||
        token.length === 0 ||
        (loggedUserRole !== "admin" && loggedUserRole !== "empresa")
      ) {
        setErrorMessage("La respuesta del servidor no incluyó una sesión válida.");
        return;
      }

      saveAuthSession(
        {
          token,
          role: loggedUserRole,
          email: email.trim(),
          displayName: safeDisplayName
        },
        rememberMe
      );
      const from = (location.state as LoginLocationState | null)?.from;
      navigate(resolveTargetRoute(loggedUserRole, from), { replace: true });
      return;
    } catch {
      setErrorMessage("No se pudo conectar con el backend. Verificá que la API esté levantada.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrivateLayout>
      <section className="login-page">
        <div className="login-card">
          <Link to="/" className="login-back-link">
            ← Volver al inicio
          </Link>
          <header>
            <p>Ingreso al sistema</p>
            <h1>Admin / Empresa</h1>
            <small>
              Seleccioná el perfil de acceso y cargá tus credenciales.
            </small>
          </header>

          <div className="role-switch" role="tablist" aria-label="Tipo de acceso">
            <button
              type="button"
              className={role === "admin" ? "active" : ""}
              onClick={() => setRole("admin")}
            >
              Administrador
            </button>
            <button
              type="button"
              className={role === "empresa" ? "active" : ""}
              onClick={() => setRole("empresa")}
            >
              Empresa
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage("");
                }}
                placeholder="empresa@correo.com"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrorMessage("");
                }}
                placeholder="••••••••"
              />
            </label>

            <label className="remember-check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Recordar sesión</span>
            </label>

            {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <footer>
            <Link to="/register">¿No tenés cuenta? Inscribí tu empresa</Link>
          </footer>
        </div>
      </section>
    </PrivateLayout>
  );
}
