import type { Request, Response } from "express";
import { createSpecialRequest } from "../services/special-requests.service";
import { isSpecialRequestKind } from "../types/special-requests.types";

const getRequiredString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const parseOptionalId = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

export const postPublicSpecialRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const source = (req.body ?? {}) as Record<string, unknown>;

  if (!isSpecialRequestKind(source.kind)) {
    res.status(400).json({
      success: false,
      error: "kind inválido"
    });
    return;
  }

  const requestedProduct =
    getRequiredString(source.requestedProduct) ??
    getRequiredString(source.subject) ??
    (source.kind === "info_request" ? "Solicitud de información" : undefined);

  if (!requestedProduct || requestedProduct.length < 2) {
    res.status(400).json({
      success: false,
      error: "requestedProduct es obligatorio"
    });
    return;
  }

  const requesterName = getRequiredString(source.requesterName);
  if (!requesterName || requesterName.length < 2) {
    res.status(400).json({
      success: false,
      error: "requesterName es obligatorio"
    });
    return;
  }

  const requesterEmail = getRequiredString(source.requesterEmail);
  if (!requesterEmail || !isValidEmail(requesterEmail)) {
    res.status(400).json({
      success: false,
      error: "requesterEmail inválido"
    });
    return;
  }

  try {
    const created = await createSpecialRequest({
      kind: source.kind,
      sourceQuery: getOptionalString(source.sourceQuery),
      requestedProduct,
      productName: getOptionalString(source.productName),
      profileId: parseOptionalId(source.profileId),
      details: getOptionalString(source.details),
      requesterName,
      requesterEmail,
      requesterPhone: getOptionalString(source.requesterPhone),
      requesterCompany: getOptionalString(source.requesterCompany)
    });

    res.status(201).json({
      success: true,
      message:
        source.kind === "info_request"
          ? "Solicitud de información registrada"
          : "Pedido especial registrado",
      data: created
    });
  } catch (error) {
    if (error instanceof Error && error.message === "profile_not_found") {
      res.status(404).json({
        success: false,
        error: "Empresa no encontrada o no publicada"
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "No se pudo registrar el pedido especial"
    });
  }
};
