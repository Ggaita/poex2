import type { Request, Response } from "express";
import type { CompanyProfileDataPatch, ProfileAuditActor } from "../types/profile.types";
import { getCompanyOwnProfile, updateCompanyOwnProfile } from "../services/profiles.service";

const requiredFieldIsInvalid = (payload: CompanyProfileDataPatch): boolean => {
  const requiredKeys: Array<keyof CompanyProfileDataPatch> = [
    "companyName",
    "contactName",
    "contactEmail"
  ];

  return requiredKeys.some((key) => {
    if (!(key in payload)) {
      return false;
    }

    const value = payload[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
};

const getAuditActor = (req: Request): ProfileAuditActor => {
  return {
    userId: req.authUser?.userId,
    email: req.authUser?.email,
    role: req.authUser?.role,
    displayName: req.authUser?.displayName
  };
};

export const getCompanyProfileMe = async (req: Request, res: Response): Promise<void> => {
  const authUser = req.authUser;
  if (!authUser?.userId || !authUser.email) {
    res.status(401).json({
      success: false,
      error: "Sesión inválida"
    });
    return;
  }

  try {
    const profile = await getCompanyOwnProfile(authUser.userId, authUser.email);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: "Todavía no tenés un perfil de empresa asociado"
      });
      return;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener el perfil de empresa"
    });
  }
};

export const patchCompanyProfileMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authUser = req.authUser;
  if (!authUser?.userId || !authUser.email) {
    res.status(401).json({
      success: false,
      error: "Sesión inválida"
    });
    return;
  }

  const payload = (req.body ?? {}) as CompanyProfileDataPatch;

  if (requiredFieldIsInvalid(payload)) {
    res.status(400).json({
      success: false,
      error: "companyName, contactName y contactEmail no pueden quedar vacíos"
    });
    return;
  }

  try {
    const result = await updateCompanyOwnProfile(
      authUser.userId,
      authUser.email,
      payload,
      getAuditActor(req)
    );

    if (result.status === "not_found") {
      res.status(404).json({
        success: false,
        error: "Todavía no tenés un perfil de empresa asociado"
      });
      return;
    }

    if (result.status === "forbidden") {
      res.status(403).json({
        success: false,
        error: "Tu perfil está en modo administrado por Agencia y no permite edición"
      });
      return;
    }

    res.json({
      success: true,
      message: "Perfil actualizado correctamente",
      data: result.profile
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar el perfil de empresa"
    });
  }
};
