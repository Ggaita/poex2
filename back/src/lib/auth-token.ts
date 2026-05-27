import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { AuthTokenPayload, AuthUser, LoginRole } from "../types/auth.types";

const getJwtSecret = (): string => {
  const secret = process.env.AUTH_JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("Falta configurar AUTH_JWT_SECRET");
  }

  return secret;
};

const getJwtExpiresIn = (): SignOptions["expiresIn"] => {
  const expiresInRaw = process.env.AUTH_JWT_EXPIRES_IN?.trim();
  if (!expiresInRaw) {
    return "8h";
  }

  return expiresInRaw as SignOptions["expiresIn"];
};

const isLoginRole = (value: unknown): value is LoginRole => {
  return value === "admin" || value === "empresa";
};

const isTokenPayload = (value: unknown): value is AuthTokenPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<AuthTokenPayload>;
  return (
    typeof payload.userId === "number" &&
    typeof payload.email === "string" &&
    payload.email.length > 0 &&
    isLoginRole(payload.role) &&
    typeof payload.displayName === "string" &&
    payload.displayName.length > 0
  );
};

export const ensureAuthTokenConfig = (): void => {
  getJwtSecret();
  getJwtExpiresIn();
};

export const createAuthToken = (user: AuthUser): string => {
  const payload: Omit<AuthTokenPayload, "iat" | "exp"> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn()
  });
};

export const verifyAuthToken = (token: string): AuthTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload | string;

    if (!isTokenPayload(decoded)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};
