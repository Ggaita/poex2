import type { Request, Response } from "express";
import {
  countPendingApplications,
  getApplicationById,
  listApplications,
  updateApplicationStatus
} from "../services/applications.service";
import type { ApplicationStatus } from "../../../types/application.types";

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const isStatus = (value: unknown): value is ApplicationStatus => {
  return value === "pending" || value === "approved" || value === "rejected";
};

export const getAdminApplicationsPendingCount = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const count = await countPendingApplications();
    res.json({
      success: true,
      data: { count }
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener el contador de solicitudes pendientes"
    });
  }
};

export const getAdminApplications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const statusQuery = req.query?.status;
  const statusRaw = typeof statusQuery === "string" ? statusQuery : undefined;
  let statusFilter: ApplicationStatus | undefined;

  if (!statusRaw) {
    statusFilter = undefined;
  } else if (!isStatus(statusRaw)) {
    res.status(400).json({
      success: false,
      error: "status inválido"
    });
    return;
  } else {
    statusFilter = statusRaw;
  }

  try {
    const rows = await listApplications(statusFilter);

    res.json({
      success: true,
      data: rows
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: "No se pudieron obtener las solicitudes"
    });
  }
};

export const getAdminApplicationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  try {
    const application = await getApplicationById(id);

    if (!application) {
      res.status(404).json({
        success: false,
        error: "Solicitud no encontrada"
      });
      return;
    }

    res.json({
      success: true,
      data: application
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener la solicitud"
    });
  }
};

export const updateAdminApplicationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  const status = req.body?.status;
  const rejectionReason = getOptionalString(req.body?.rejectionReason);
  const reviewedBy = req.authUser?.displayName || req.authUser?.email || "admin";

  if (status !== "approved" && status !== "rejected") {
    res.status(400).json({
      success: false,
      error: "status debe ser approved o rejected"
    });
    return;
  }

  try {
    const result = await updateApplicationStatus(id, {
      status,
      reviewedBy,
      rejectionReason,
      reviewedByUserId: req.authUser?.userId,
      reviewedByEmail: req.authUser?.email,
      reviewedByRole: req.authUser?.role
    });

    if (result.error === "not_found") {
      res.status(404).json({
        success: false,
        error: "Solicitud no encontrada"
      });
      return;
    }

    if (result.error === "already_reviewed") {
      res.status(409).json({
        success: false,
        error: "La solicitud ya fue evaluada"
      });
      return;
    }

    res.json({
      success: true,
      message: "Estado de solicitud actualizado",
      data: result.application
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar la solicitud"
    });
  }
};
