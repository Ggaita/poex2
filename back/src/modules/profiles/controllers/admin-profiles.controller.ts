import type { Request, Response } from "express";
import type {
  CompanyProductInput,
  CompanyProductPatch,
  CompanyProductReviewPatch,
  CompanyProfileDataPatch,
  CompanyProfileSettingsPatch,
  ProfileAuditActor,
  ProfileEditMode
} from "../types/profile.types";
import {
  createAdminProfileProduct,
  deleteAdminProfileProduct,
  getAdminProfileById,
  isProfileFieldKey,
  listAdminProfiles,
  listProfileAuditLogs,
  reviewAdminProfileProduct,
  updateAdminProfileProduct,
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

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidTariffPosition = (value: string): boolean => {
  const cleaned = value.trim();
  if (!cleaned) {
    return true;
  }

  return /^[0-9A-Za-z./-]{4,20}$/.test(cleaned);
};

const parseAdminProductPayload = (
  body: unknown,
  options: { requireName: boolean }
):
  | { ok: true; payload: CompanyProductInput | CompanyProductPatch }
  | { ok: false; error: string } => {
  const source = (body ?? {}) as Record<string, unknown>;
  const hasName = "name" in source;
  const hasDescription = "description" in source;
  const hasImageUrl = "imageUrl" in source;
  const hasTariffPosition = "tariffPosition" in source;
  const hasUnknownFlag = "isTariffPositionUnknown" in source;

  if (!options.requireName && !hasName && !hasDescription && !hasImageUrl && !hasTariffPosition && !hasUnknownFlag) {
    return { ok: false, error: "Debe enviarse al menos un campo para actualizar el producto." };
  }

  const payload: CompanyProductInput | CompanyProductPatch = {};

  if (hasName || options.requireName) {
    if (typeof source.name !== "string" || source.name.trim().length === 0) {
      return { ok: false, error: "El nombre del producto es obligatorio." };
    }
    payload.name = source.name.trim();
  }

  if (hasDescription) {
    if (source.description !== null && typeof source.description !== "string") {
      return { ok: false, error: "La descripción del producto es inválida." };
    }
    payload.description =
      typeof source.description === "string" ? source.description.trim() : null;
  }

  if (hasImageUrl) {
    if (source.imageUrl !== null && typeof source.imageUrl !== "string") {
      return { ok: false, error: "La URL de imagen es inválida." };
    }

    const imageUrl = typeof source.imageUrl === "string" ? source.imageUrl.trim() : "";
    if (imageUrl && !isValidHttpUrl(imageUrl)) {
      return { ok: false, error: "La imagen debe ser una URL http/https válida." };
    }
    payload.imageUrl = imageUrl || null;
  }

  if (hasTariffPosition) {
    if (source.tariffPosition !== null && typeof source.tariffPosition !== "string") {
      return { ok: false, error: "La Posición Arancelaria es inválida." };
    }

    const tariffPosition =
      typeof source.tariffPosition === "string" ? source.tariffPosition.trim() : "";
    if (tariffPosition && !isValidTariffPosition(tariffPosition)) {
      return {
        ok: false,
        error: "La Posición Arancelaria debe tener entre 4 y 20 caracteres válidos."
      };
    }
    payload.tariffPosition = tariffPosition || null;
  }

  if (hasUnknownFlag) {
    if (typeof source.isTariffPositionUnknown !== "boolean") {
      return { ok: false, error: "El indicador de P.A. desconocida es inválido." };
    }
    payload.isTariffPositionUnknown = source.isTariffPositionUnknown;
  }

  return { ok: true, payload };
};

const parseAdminProductReviewPayload = (
  body: unknown
): { ok: true; payload: CompanyProductReviewPatch } | { ok: false; error: string } => {
  const source = (body ?? {}) as Record<string, unknown>;

  if (typeof source.isAccepted !== "boolean") {
    return { ok: false, error: "Debe indicarse si el producto está aceptado o no." };
  }

  if (source.isAccepted) {
    return {
      ok: true,
      payload: {
        isAccepted: true,
        rejectionMessage: null
      }
    };
  }

  const rejectionMessage =
    typeof source.rejectionMessage === "string" ? source.rejectionMessage.trim() : "";
  if (!rejectionMessage) {
    return {
      ok: false,
      error: "Si el producto no es aceptado, debés indicar un mensaje para la empresa."
    };
  }

  if (rejectionMessage.length > 500) {
    return {
      ok: false,
      error: "El mensaje de no aceptación no puede superar los 500 caracteres."
    };
  }

  return {
    ok: true,
    payload: {
      isAccepted: false,
      rejectionMessage
    }
  };
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

export const postAdminProfileProduct = async (
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

  const parsedPayload = parseAdminProductPayload(req.body, { requireName: true });
  if (!parsedPayload.ok) {
    res.status(400).json({
      success: false,
      error: parsedPayload.error
    });
    return;
  }

  try {
    const product = await createAdminProfileProduct(
      profileId,
      parsedPayload.payload as CompanyProductInput,
      getAuditActor(req)
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: "Perfil no encontrado"
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Producto creado",
      data: product
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo crear el producto"
    });
  }
};

export const patchAdminProfileProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = parseId(req.params?.id);
  const productId = parseId(req.params?.productId);
  if (profileId === null || productId === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  const parsedPayload = parseAdminProductPayload(req.body, { requireName: false });
  if (!parsedPayload.ok) {
    res.status(400).json({
      success: false,
      error: parsedPayload.error
    });
    return;
  }

  try {
    const product = await updateAdminProfileProduct(
      profileId,
      productId,
      parsedPayload.payload as CompanyProductPatch,
      getAuditActor(req)
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: "Producto no encontrado para ese perfil"
      });
      return;
    }

    res.json({
      success: true,
      message: "Producto actualizado",
      data: product
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar el producto"
    });
  }
};

export const patchAdminProfileProductReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = parseId(req.params?.id);
  const productId = parseId(req.params?.productId);
  if (profileId === null || productId === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  const parsedPayload = parseAdminProductReviewPayload(req.body);
  if (!parsedPayload.ok) {
    res.status(400).json({
      success: false,
      error: parsedPayload.error
    });
    return;
  }

  try {
    const product = await reviewAdminProfileProduct(
      profileId,
      productId,
      parsedPayload.payload,
      getAuditActor(req)
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: "Producto no encontrado para ese perfil"
      });
      return;
    }

    res.json({
      success: true,
      message: parsedPayload.payload.isAccepted
        ? "Producto aceptado"
        : "Producto no aceptado",
      data: product
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo registrar la revisión del producto"
    });
  }
};

export const deleteAdminProfileProductHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = parseId(req.params?.id);
  const productId = parseId(req.params?.productId);
  if (profileId === null || productId === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  try {
    const deleted = await deleteAdminProfileProduct(profileId, productId, getAuditActor(req));
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: "Producto no encontrado para ese perfil"
      });
      return;
    }

    res.json({
      success: true,
      message: "Producto eliminado"
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo eliminar el producto"
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
