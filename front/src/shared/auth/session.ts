export type AuthRole = "admin" | "empresa";

export interface AuthSession {
  token: string;
  role: AuthRole;
  email: string;
  displayName: string;
}

const AUTH_SESSION_KEY = "poex_auth_session";
const ADMIN_REVIEWER_KEY = "poex_admin_display_name";

const isValidRole = (value: unknown): value is AuthRole => {
  return value === "admin" || value === "empresa";
};

export const getDefaultPrivateRoute = (role: AuthRole): string => {
  return role === "admin" ? "/admin/dashboard" : "/empresa/panel";
};

const parseSession = (raw: string | null): AuthSession | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed.token === "string" &&
      parsed.token.length > 0 &&
      isValidRole(parsed.role) &&
      typeof parsed.email === "string" &&
      parsed.email.length > 0 &&
      typeof parsed.displayName === "string" &&
      parsed.displayName.length > 0
    ) {
      return {
        token: parsed.token,
        role: parsed.role,
        email: parsed.email,
        displayName: parsed.displayName
      };
    }

    return null;
  } catch {
    return null;
  }
};

const readFromStorage = (storage: Storage): AuthSession | null => {
  return parseSession(storage.getItem(AUTH_SESSION_KEY));
};

export const getAuthSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return readFromStorage(sessionStorage) ?? readFromStorage(localStorage);
};

export const saveAuthSession = (
  session: AuthSession,
  rememberSession: boolean
): void => {
  if (typeof window === "undefined") {
    return;
  }

  clearAuthSession();
  const targetStorage = rememberSession ? localStorage : sessionStorage;
  targetStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
};

export const clearAuthSession = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
};

export const getStoredReviewerName = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    sessionStorage.getItem(ADMIN_REVIEWER_KEY) ??
    localStorage.getItem(ADMIN_REVIEWER_KEY)
  );
};

export const setStoredReviewerName = (value: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  const clean = value.trim();
  if (!clean) {
    return;
  }

  localStorage.setItem(ADMIN_REVIEWER_KEY, clean);
  sessionStorage.setItem(ADMIN_REVIEWER_KEY, clean);
};
