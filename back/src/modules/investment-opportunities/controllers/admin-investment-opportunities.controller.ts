import type { Request, Response } from "express";
import {
  countPendingInquiries,
  createOpportunity,
  deleteOpportunity,
  getAdminOpportunityById,
  listAdminInquiries,
  listAdminOpportunities,
  updateInquiry,
  updateOpportunity
} from "../services/investment-opportunities.service";
import type {
  InvestmentAssetInput,
  InvestmentOpportunityCreateInput,
  InvestmentOpportunityUpdateInput
} from "../types/investment-opportunities.types";
import {
  isInvestmentAssetKind,
  isInvestmentInquiryStatus,
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

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return undefined;
};

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const parseAssets = (value: unknown): InvestmentAssetInput[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const assets: InvestmentAssetInput[] = [];
  value.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }
    const row = item as Record<string, unknown>;
    if (!isInvestmentAssetKind(row.kind)) {
      return;
    }
    const url = getOptionalString(row.url);
    if (!url) {
      return;
    }
    assets.push({
      kind: row.kind,
      url,
      label: getOptionalString(row.label) ?? null,
      sortOrder: parseNumber(row.sortOrder) ?? index
    });
  });

  return assets;
};

const parseCreateBody = (
  source: Record<string, unknown>
): { data?: InvestmentOpportunityCreateInput; error?: string } => {
  const title = getRequiredString(source.title);
  const fullDescription = getRequiredString(source.fullDescription);
  const sector = getRequiredString(source.sector);
  const locality = getRequiredString(source.locality);
  const mainImageUrl = getRequiredString(source.mainImageUrl);

  if (!title) return { error: "title es obligatorio" };
  if (!fullDescription) return { error: "fullDescription es obligatorio" };
  if (!sector) return { error: "sector es obligatorio" };
  if (!locality) return { error: "locality es obligatorio" };
  if (!mainImageUrl) return { error: "mainImageUrl es obligatorio" };
  if (!isInvestmentOpportunityType(source.type)) return { error: "type inválido" };
  if (!isInvestmentOpportunityStatus(source.status)) return { error: "status inválido" };

  return {
    data: {
      title,
      shortDescription: getOptionalString(source.shortDescription) ?? null,
      fullDescription,
      sector,
      locality,
      type: source.type,
      status: source.status,
      estimatedInvestment: getOptionalString(source.estimatedInvestment) ?? null,
      mainImageUrl,
      isFeatured: parseBoolean(source.isFeatured) ?? false,
      isPublished: parseBoolean(source.isPublished) ?? false,
      sortOrder: parseNumber(source.sortOrder) ?? 0,
      slug: getOptionalString(source.slug) ?? null,
      assets: parseAssets(source.assets) ?? []
    }
  };
};

const parseUpdateBody = (
  source: Record<string, unknown>
): { data?: InvestmentOpportunityUpdateInput; error?: string } => {
  const data: InvestmentOpportunityUpdateInput = {};

  if (source.title !== undefined) {
    const title = getRequiredString(source.title);
    if (!title) return { error: "title inválido" };
    data.title = title;
  }
  if (source.shortDescription !== undefined) {
    data.shortDescription = getOptionalString(source.shortDescription) ?? null;
  }
  if (source.fullDescription !== undefined) {
    const fullDescription = getRequiredString(source.fullDescription);
    if (!fullDescription) return { error: "fullDescription inválido" };
    data.fullDescription = fullDescription;
  }
  if (source.sector !== undefined) {
    const sector = getRequiredString(source.sector);
    if (!sector) return { error: "sector inválido" };
    data.sector = sector;
  }
  if (source.locality !== undefined) {
    const locality = getRequiredString(source.locality);
    if (!locality) return { error: "locality inválido" };
    data.locality = locality;
  }
  if (source.type !== undefined) {
    if (!isInvestmentOpportunityType(source.type)) return { error: "type inválido" };
    data.type = source.type;
  }
  if (source.status !== undefined) {
    if (!isInvestmentOpportunityStatus(source.status)) return { error: "status inválido" };
    data.status = source.status;
  }
  if (source.estimatedInvestment !== undefined) {
    data.estimatedInvestment = getOptionalString(source.estimatedInvestment) ?? null;
  }
  if (source.mainImageUrl !== undefined) {
    const mainImageUrl = getRequiredString(source.mainImageUrl);
    if (!mainImageUrl) return { error: "mainImageUrl inválido" };
    data.mainImageUrl = mainImageUrl;
  }
  if (source.isFeatured !== undefined) {
    const isFeatured = parseBoolean(source.isFeatured);
    if (isFeatured === undefined) return { error: "isFeatured inválido" };
    data.isFeatured = isFeatured;
  }
  if (source.isPublished !== undefined) {
    const isPublished = parseBoolean(source.isPublished);
    if (isPublished === undefined) return { error: "isPublished inválido" };
    data.isPublished = isPublished;
  }
  if (source.sortOrder !== undefined) {
    const sortOrder = parseNumber(source.sortOrder);
    if (sortOrder === undefined) return { error: "sortOrder inválido" };
    data.sortOrder = sortOrder;
  }
  if (source.slug !== undefined) {
    data.slug = getOptionalString(source.slug) ?? null;
  }
  if (source.assets !== undefined) {
    data.assets = parseAssets(source.assets) ?? [];
  }

  return { data };
};

export const getAdminInvestmentOpportunities = async (
  req: Request,
  res: Response
): Promise<void> => {
  const q = getOptionalString(req.query?.q);
  const published = parseBoolean(req.query?.published);

  try {
    const rows = await listAdminOpportunities({ q, published });
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron obtener las oportunidades"
    });
  }
};

export const getAdminInvestmentOpportunityDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({ success: false, error: "id inválido" });
    return;
  }

  try {
    const row = await getAdminOpportunityById(id);
    if (!row) {
      res.status(404).json({ success: false, error: "Oportunidad no encontrada" });
      return;
    }
    res.json({ success: true, data: row });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener la oportunidad"
    });
  }
};

export const postAdminInvestmentOpportunity = async (
  req: Request,
  res: Response
): Promise<void> => {
  const source = (req.body ?? {}) as Record<string, unknown>;
  const parsed = parseCreateBody(source);
  if (!parsed.data) {
    res.status(400).json({ success: false, error: parsed.error ?? "Datos inválidos" });
    return;
  }

  try {
    const created = await createOpportunity(parsed.data);
    res.status(201).json({
      success: true,
      message: "Oportunidad creada",
      data: created
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo crear la oportunidad"
    });
  }
};

export const patchAdminInvestmentOpportunity = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({ success: false, error: "id inválido" });
    return;
  }

  const source = (req.body ?? {}) as Record<string, unknown>;
  const parsed = parseUpdateBody(source);
  if (!parsed.data) {
    res.status(400).json({ success: false, error: parsed.error ?? "Datos inválidos" });
    return;
  }

  try {
    const updated = await updateOpportunity(id, parsed.data);
    if (!updated) {
      res.status(404).json({ success: false, error: "Oportunidad no encontrada" });
      return;
    }
    res.json({
      success: true,
      message: "Oportunidad actualizada",
      data: updated
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar la oportunidad"
    });
  }
};

export const deleteAdminInvestmentOpportunity = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({ success: false, error: "id inválido" });
    return;
  }

  try {
    const deleted = await deleteOpportunity(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Oportunidad no encontrada" });
      return;
    }
    res.json({ success: true, message: "Oportunidad eliminada" });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo eliminar la oportunidad"
    });
  }
};

export const getAdminInvestmentInquiries = async (
  req: Request,
  res: Response
): Promise<void> => {
  const q = getOptionalString(req.query?.q);
  const statusRaw = getOptionalString(req.query?.status);

  if (statusRaw !== undefined && !isInvestmentInquiryStatus(statusRaw)) {
    res.status(400).json({ success: false, error: "status inválido" });
    return;
  }

  try {
    const rows = await listAdminInquiries({
      q,
      status:
        statusRaw !== undefined && isInvestmentInquiryStatus(statusRaw)
          ? statusRaw
          : undefined
    });
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron obtener las consultas"
    });
  }
};

export const getAdminInvestmentInquiriesPendingCount = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const count = await countPendingInquiries();
    res.json({ success: true, data: { count } });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener el contador de consultas"
    });
  }
};

export const patchAdminInvestmentInquiry = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({ success: false, error: "id inválido" });
    return;
  }

  const source = (req.body ?? {}) as Record<string, unknown>;
  if (!isInvestmentInquiryStatus(source.status)) {
    res.status(400).json({ success: false, error: "status inválido" });
    return;
  }

  try {
    const updated = await updateInquiry(id, {
      status: source.status,
      adminNotes: getOptionalString(source.adminNotes) ?? null,
      reviewedByUserId: req.authUser?.userId,
      reviewedByEmail: req.authUser?.email
    });

    if (!updated) {
      res.status(404).json({ success: false, error: "Consulta no encontrada" });
      return;
    }

    res.json({
      success: true,
      message: "Consulta actualizada",
      data: updated
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar la consulta"
    });
  }
};
