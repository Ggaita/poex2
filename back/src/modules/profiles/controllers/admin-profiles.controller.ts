import type { Request, Response } from "express";
import type {
  CompanyProfileDataPatch,
  CompanyProfileSettingsPatch,
  ProfileAuditActor,
  ProfileEditMode
} from "../types/profile.types";
import {
  getAdminProfileById,
  isProfileFieldKey,
  listAdminProfiles,
  listProfileAuditLogs,
  updateAdminProfileData,
  updateAdminProfileSettings,
  updateAdminProfileVisibility
} from "../services/profiles.service";

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const isEditMode = (value: unknown): value is ProfileEditMode => {
  return value === "agency" || value === "company" || value === "mixed";
};

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

export const getAdminProfiles = async (req: Request, res: Response): Promise<void> => {
  const query = getOptionalString(req.query?.q);

  try {
    const profiles = await listAdminProfiles(query);
    res.json({
      success: true,
      data: profiles
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron obtener los perfiles de empresa"
    });
  }
};

export const getAdminProfileDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = parseId(req.params?.id);
  if (profileId === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  try {
    const profile = await getAdminProfileById(profileId);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: "Perfil no encontrado"
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
      error: "No se pudo obtener el perfil"
    });
  }
};

export const patchAdminProfileData = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = parseId(req.params?.id);
  if (profileId === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
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
    const profile = await updateAdminProfileData(profileId, payload, getAuditActor(req));
    if (!profile) {
      res.status(404).json({
        success: false,
        error: "Perfil no encontrado"
      });
      return;
    }

    res.json({
      success: true,
      message: "Perfil actualizado",
      data: profile
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar el perfil"
    });
  }
};

export const patchAdminProfileSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = parseId(req.params?.id);
  if (profileId === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  const rawEditMode = req.body?.editMode;
  const rawIsPublished = req.body?.isPublished;

  const payload: CompanyProfileSettingsPatch = {};
  if (isEditMode(rawEditMode)) {
    payload.editMode = rawEditMode;
  }
  if (typeof rawIsPublished === "boolean") {
    payload.isPublished = rawIsPublished;
  }

  if (!payload.editMode && typeof payload.isPublished !== "boolean") {
    res.status(400).json({
      success: false,
      error: "Debe enviarse editMode y/o isPublished"
    });
    return;
  }

  try {
    const profile = await updateAdminProfileSettings(
      profileId,
      payload,
      getAuditActor(req)
    );

    if (!profile) {
      res.status(404).json({
        success: false,
        error: "Perfil no encontrado"
      });
      return;
    }

    res.json({
      success: true,
      message: "Configuración del perfil actualizada",
      data: profile
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar la configuración del perfil"
    });
  }
};

export const patchAdminProfileVisibility = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = parseId(req.params?.id);
  if (profileId === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  const fieldKey = req.body?.fieldKey;
  const isVisible = req.body?.isVisible;

  if (!isProfileFieldKey(fieldKey) || typeof isVisible !== "boolean") {
    res.status(400).json({
      success: false,
      error: "fieldKey o isVisible inválidos"
    });
    return;
  }

  try {
    const profile = await updateAdminProfileVisibility(
      profileId,
      { fieldKey, isVisible },
      getAuditActor(req)
    );

    if (!profile) {
      res.status(404).json({
        success: false,
        error: "Perfil no encontrado"
      });
      return;
    }

    res.json({
      success: true,
      message: "Visibilidad de campo actualizada",
      data: profile
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar la visibilidad del campo"
    });
  }
};

export const getAdminProfileAuditTrail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = parseId(req.params?.id);
  if (profileId === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  const limit = Number.parseInt(String(req.query?.limit ?? "100"), 10);
  const safeLimit = Number.isNaN(limit) ? 100 : Math.max(1, Math.min(500, limit));

  try {
    const profile = await getAdminProfileById(profileId);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: "Perfil no encontrado"
      });
      return;
    }

    const rows = await listProfileAuditLogs(profileId, safeLimit);
    res.json({
      success: true,
      data: rows
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener el historial del perfil"
    });
  }
};
