import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/auth-token";
import type { LoginRole } from "../types/auth.types";

const getBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
};

export const authenticateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({
      success: false,
      error: "Token de acceso requerido"
    });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: "Token inválido o expirado"
    });
    return;
  }

  req.authUser = payload;
  next();
};

export const requireRole = (...roles: LoginRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authUser = req.authUser;
    if (!authUser) {
      res.status(401).json({
        success: false,
        error: "No autenticado"
      });
      return;
    }

    if (!roles.includes(authUser.role)) {
      res.status(403).json({
        success: false,
        error: "No autorizado para este recurso"
      });
      return;
    }

    next();
  };
};
