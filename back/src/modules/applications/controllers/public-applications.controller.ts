import type { Request, Response } from "express";
import { createApplication } from "../services/applications.service";

const getRequiredString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const createPublicApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  const companyName = getRequiredString(req.body?.companyName);
  const contactName = getRequiredString(req.body?.contactName);
  const email = getRequiredString(req.body?.email);
  const phone = getOptionalString(req.body?.phone);
  const taxId = getOptionalString(req.body?.taxId);
  const message = getOptionalString(req.body?.message);

  if (!companyName || !contactName || !email) {
    res.status(400).json({
      success: false,
      error: "companyName, contactName y email son obligatorios"
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      success: false,
      error: "email inválido"
    });
    return;
  }

  try {
    const result = await createApplication({
      companyName,
      contactName,
      email,
      phone,
      taxId,
      message
    });

    if (result.error === "duplicate_email") {
      res.status(409).json({
        success: false,
        error: "Ya existe una solicitud con ese email"
      });
      return;
    }

    if (result.error === "duplicate_tax_id") {
      res.status(409).json({
        success: false,
        error: "Ya existe una solicitud con ese taxId"
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Solicitud enviada correctamente",
      data: result.application
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: "No se pudo crear la solicitud"
    });
  }
};
