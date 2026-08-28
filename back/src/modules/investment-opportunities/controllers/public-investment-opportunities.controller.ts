import type { Request, Response } from "express";
import {
  createInquiry,
  getPublicOpportunityBySlug,
  listPublicOpportunities
} from "../services/investment-opportunities.service";
import {
  isInvestmentOpportunityStatus,
  isInvestmentOpportunityType
} from "../types/investment-opportunities.types";

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const getRequiredString = (value: unknown): string | undefined => getOptionalString(value);

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const parseId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const getPublicInvestmentOpportunities = async (
  req: Request,
  res: Response
): Promise<void> => {
  const typeRaw = getOptionalString(req.query?.type);
  const statusRaw = getOptionalString(req.query?.status);
  const q = getOptionalString(req.query?.q);

  if (typeRaw !== undefined && !isInvestmentOpportunityType(typeRaw)) {
    res.status(400).json({ success: false, error: "type inválido" });
    return;
  }
  if (statusRaw !== undefined && !isInvestmentOpportunityStatus(statusRaw)) {
    res.status(400).json({ success: false, error: "status inválido" });
    return;
  }

  try {
    const rows = await listPublicOpportunities({
      type: typeRaw !== undefined && isInvestmentOpportunityType(typeRaw) ? typeRaw : undefined,
      status:
        statusRaw !== undefined && isInvestmentOpportunityStatus(statusRaw)
          ? statusRaw
          : undefined,
      q
    });
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron obtener las oportunidades de inversión"
    });
  }
};

export const getPublicInvestmentOpportunityDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const slug = getOptionalString(req.params?.slug);
  if (!slug) {
    res.status(400).json({ success: false, error: "slug inválido" });
    return;
  }

  try {
    const row = await getPublicOpportunityBySlug(slug);
    if (!row) {
      res.status(404).json({ success: false, error: "Oportunidad no encontrada" });
      return;
    }
    res.json({ success: true, data: row });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener la oportunidad de inversión"
    });
  }
};

export const postPublicInvestmentInquiry = async (
  req: Request,
  res: Response
): Promise<void> => {
  const source = (req.body ?? {}) as Record<string, unknown>;
  const opportunityId = parseId(source.opportunityId ?? req.params?.id);

  if (opportunityId === null) {
    res.status(400).json({ success: false, error: "opportunityId inválido" });
    return;
  }

  const requesterName = getRequiredString(source.requesterName);
  const requesterEmail = getRequiredString(source.requesterEmail);
  const message = getRequiredString(source.message);

  if (!requesterName || requesterName.length < 2) {
    res.status(400).json({ success: false, error: "requesterName es obligatorio" });
    return;
  }
  if (!requesterEmail || !isValidEmail(requesterEmail)) {
    res.status(400).json({ success: false, error: "requesterEmail inválido" });
    return;
  }
  if (!message || message.length < 5) {
    res.status(400).json({ success: false, error: "message es obligatorio" });
    return;
  }

  try {
    const created = await createInquiry({
      opportunityId,
      requesterName,
      requesterEmail,
      requesterPhone: getOptionalString(source.requesterPhone),
      requesterCompany: getOptionalString(source.requesterCompany),
      message
    });

    res.status(201).json({
      success: true,
      message: "Consulta registrada",
      data: created
    });
  } catch (error) {
    if (error instanceof Error && error.message === "opportunity_not_found") {
      res.status(404).json({
        success: false,
        error: "Oportunidad no encontrada o no publicada"
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "No se pudo registrar la consulta"
    });
  }
};
