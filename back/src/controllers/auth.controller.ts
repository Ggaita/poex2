import type { Request, Response } from "express";
import { loginWithCredentials } from "../data/auth.store";
import { createAuthToken } from "../lib/auth-token";
import type { LoginRole } from "../types/auth.types";

const getRequiredString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const isLoginRole = (value: unknown): value is LoginRole => {
  return value === "admin" || value === "empresa";
};


export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const email = getRequiredString(req.body?.email);
  const password = getRequiredString(req.body?.password);
  const role = req.body?.role;

  if (!email || !password || !isLoginRole(role)) {
    res.status(400).json({
      success: false,
      error: "email, password y role son obligatorios"
    });
    return;
  }

  try {
    const result = await loginWithCredentials({
      email,
      password,
      role
    });
    const user = result.user;

    if (!user && result.error === "invalid_credentials") {
      res.status(401).json({
        success: false,
        error: "Credenciales inválidas"
      });
      return;
    }
    if (!user && result.error === "inactive_user") {
      res.status(403).json({
        success: false,
        error: "Usuario inactivo"
      });
      return;
    }

    if (!user) {
      res.status(500).json({
        success: false,
        error: "No se pudo iniciar sesión"
      });
      return;
    }

    res.json({
      success: true,
      message: "Login correcto",
      data: {
        user,
        token: createAuthToken(user)
      }
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: "No se pudo iniciar sesión"
    });
  }
};
