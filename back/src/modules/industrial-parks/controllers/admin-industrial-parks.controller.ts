import type { Request, Response } from "express";
import {
  createIndustrialPark,
  deleteIndustrialPark,
  getAdminIndustrialParkById,
  listAdminIndustrialParks,
  updateIndustrialPark,
  type IndustrialParkInput
} from "../services/industrial-parks.service";

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const getRequiredString = (value: unknown): string | undefined => getOptionalString(value);

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const parseNumber = (value: unknown): number | null | undefined => {
  if (value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value === "") return null;
  return undefined;
};

const parseCreateBody = (
  source: Record<string, unknown>
): { data?: IndustrialParkInput; error?: string } => {
  const name = getRequiredString(source.name);
  const locality = getRequiredString(source.locality);
  const progressStatus = getRequiredString(source.progressStatus) ?? "Sin dato";
  if (!name) return { error: "name es obligatorio" };
  if (!locality) return { error: "locality es obligatorio" };
  const measured = parseNumber(source.measuredPlots);

  return {
    data: {
      name,
      locality,
      progressStatus,
      administration: getOptionalString(source.administration) ?? null,
      department: getOptionalString(source.department) ?? null,
      yearCreated: parseNumber(source.yearCreated) ?? null,
      surfaceHa: parseNumber(source.surfaceHa) ?? null,
      measuredPlots: measured === undefined || measured === null ? null : Math.trunc(measured),
      settledCompanies: getOptionalString(source.settledCompanies) ?? null,
      infrastructure: getOptionalString(source.infrastructure) ?? null,
      renpiStatus: getOptionalString(source.renpiStatus) ?? null,
      observations: getOptionalString(source.observations) ?? null,
      sortOrder: Math.trunc(parseNumber(source.sortOrder) ?? 0),
      isPublished: parseBoolean(source.isPublished) ?? false,
      slug: getOptionalString(source.slug) ?? null
    }
  };
};

export const getAdminIndustrialParks = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await listAdminIndustrialParks({
      q: getOptionalString(req.query?.q),
      published: parseBoolean(req.query?.published)
    });
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "No se pudieron listar los parques" });
  }
};

export const getAdminIndustrialParkDetail = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({ success: false, error: "id invalido" });
    return;
  }
  try {
    const data = await getAdminIndustrialParkById(id);
    if (!data) {
      res.status(404).json({ success: false, error: "Parque no encontrado" });
      return;
    }
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "No se pudo obtener el parque" });
  }
};

export const postAdminIndustrialPark = async (req: Request, res: Response): Promise<void> => {
  const parsed = parseCreateBody((req.body ?? {}) as Record<string, unknown>);
  if (!parsed.data) {
    res.status(400).json({ success: false, error: parsed.error ?? "Datos invalidos" });
    return;
  }
  try {
    const data = await createIndustrialPark(parsed.data);
    res.status(201).json({ success: true, message: "Parque creado", data });
  } catch {
    res.status(500).json({ success: false, error: "No se pudo crear el parque" });
  }
};

export const patchAdminIndustrialPark = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({ success: false, error: "id invalido" });
    return;
  }

  const source = (req.body ?? {}) as Record<string, unknown>;
  const data: Partial<IndustrialParkInput> = {};

  if (source.name !== undefined) {
    const name = getRequiredString(source.name);
    if (!name) {
      res.status(400).json({ success: false, error: "name invalido" });
      return;
    }
    data.name = name;
  }
  if (source.locality !== undefined) {
    const locality = getRequiredString(source.locality);
    if (!locality) {
      res.status(400).json({ success: false, error: "locality invalido" });
      return;
    }
    data.locality = locality;
  }
  if (source.progressStatus !== undefined) {
    data.progressStatus = getOptionalString(source.progressStatus) ?? "Sin dato";
  }
  if (source.administration !== undefined) {
    data.administration = getOptionalString(source.administration) ?? null;
  }
  if (source.department !== undefined) {
    data.department = getOptionalString(source.department) ?? null;
  }
  if (source.yearCreated !== undefined) data.yearCreated = parseNumber(source.yearCreated) ?? null;
  if (source.surfaceHa !== undefined) data.surfaceHa = parseNumber(source.surfaceHa) ?? null;
  if (source.measuredPlots !== undefined) {
    const n = parseNumber(source.measuredPlots);
    data.measuredPlots = n === null || n === undefined ? null : Math.trunc(n);
  }
  if (source.settledCompanies !== undefined) {
    data.settledCompanies = getOptionalString(source.settledCompanies) ?? null;
  }
  if (source.infrastructure !== undefined) {
    data.infrastructure = getOptionalString(source.infrastructure) ?? null;
  }
  if (source.renpiStatus !== undefined) {
    data.renpiStatus = getOptionalString(source.renpiStatus) ?? null;
  }
  if (source.observations !== undefined) {
    data.observations = getOptionalString(source.observations) ?? null;
  }
  if (source.sortOrder !== undefined) {
    data.sortOrder = Math.trunc(parseNumber(source.sortOrder) ?? 0);
  }
  if (source.isPublished !== undefined) {
    const published = parseBoolean(source.isPublished);
    if (published === undefined) {
      res.status(400).json({ success: false, error: "isPublished invalido" });
      return;
    }
    data.isPublished = published;
  }
  if (source.slug !== undefined) data.slug = getOptionalString(source.slug) ?? null;

  try {
    const updated = await updateIndustrialPark(id, data);
    if (!updated) {
      res.status(404).json({ success: false, error: "Parque no encontrado" });
      return;
    }
    res.json({ success: true, message: "Parque actualizado", data: updated });
  } catch {
    res.status(500).json({ success: false, error: "No se pudo actualizar el parque" });
  }
};

export const deleteAdminIndustrialPark = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({ success: false, error: "id invalido" });
    return;
  }
  try {
    const ok = await deleteIndustrialPark(id);
    if (!ok) {
      res.status(404).json({ success: false, error: "Parque no encontrado" });
      return;
    }
    res.json({ success: true, message: "Parque eliminado" });
  } catch {
    res.status(500).json({ success: false, error: "No se pudo eliminar el parque" });
  }
};