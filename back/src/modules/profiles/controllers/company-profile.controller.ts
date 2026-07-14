import type { Request, Response } from "express";
import type {
  CompanyProductInput,
  CompanyProductPatch,
  CompanyProfileDataPatch,
  ProfileAuditActor
} from "../types/profile.types";
import {
  createCompanyOwnProduct,
  deleteCompanyOwnProduct,
  getCompanyOwnProfile,
  updateCompanyOwnProduct,
  updateCompanyOwnProfile
} from "../services/profiles.service";

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
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

export const postCompanyProfileProductMe = async (
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

  const parsedPayload = parseCompanyProductPayload(req.body, { requireName: true });
  if (!parsedPayload.ok) {
    res.status(400).json({
      success: false,
      error: parsedPayload.error
    });
    return;
  }

  try {
    const result = await createCompanyOwnProduct(
      authUser.userId,
      authUser.email,
      parsedPayload.payload as CompanyProductInput,
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

    res.status(201).json({
      success: true,
      message: "Producto creado correctamente",
      data: result.product
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo crear el producto"
    });
  }
};

export const patchCompanyProfileProductMe = async (
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

  const productId = parseId(req.params?.productId);
  if (productId === null) {
    res.status(400).json({
      success: false,
      error: "productId inválido"
    });
    return;
  }

  const parsedPayload = parseCompanyProductPayload(req.body, { requireName: false });
  if (!parsedPayload.ok) {
    res.status(400).json({
      success: false,
      error: parsedPayload.error
    });
    return;
  }

  try {
    const result = await updateCompanyOwnProduct(
      authUser.userId,
      authUser.email,
      productId,
      parsedPayload.payload as CompanyProductPatch,
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

    if (result.status === "product_not_found") {
      res.status(404).json({
        success: false,
        error: "Producto no encontrado para tu perfil"
      });
      return;
    }

    res.json({
      success: true,
      message: "Producto actualizado correctamente",
      data: result.product
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar el producto"
    });
  }
};

export const deleteCompanyProfileProductMe = async (
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

  const productId = parseId(req.params?.productId);
  if (productId === null) {
    res.status(400).json({
      success: false,
      error: "productId inválido"
    });
    return;
  }

  try {
    const result = await deleteCompanyOwnProduct(
      authUser.userId,
      authUser.email,
      productId,
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

    if (result.status === "product_not_found") {
      res.status(404).json({
        success: false,
        error: "Producto no encontrado para tu perfil"
      });
      return;
    }

    res.json({
      success: true,
      message: "Producto eliminado correctamente"
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo eliminar el producto"
    });
  }
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

const parseCompanyProductPayload = (
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
