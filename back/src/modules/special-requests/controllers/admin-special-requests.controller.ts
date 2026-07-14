import type { Request, Response } from "express";
import {
  getSpecialRequestById,
  listSpecialRequests,
  updateSpecialRequest
} from "../services/special-requests.service";
import {
  isSpecialRequestStatus,
  type SpecialRequestStatus
} from "../types/special-requests.types";

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const parseLimit = (value: unknown): number => {
  if (typeof value !== "string") {
    return 80;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 80;
  }

  return Math.max(1, Math.min(200, parsed));
};

export const getAdminSpecialRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  const statusRaw = req.query?.status;
  let status: SpecialRequestStatus | undefined;
  if (typeof statusRaw === "string" && statusRaw.length > 0) {
    if (!isSpecialRequestStatus(statusRaw)) {
      res.status(400).json({
        success: false,
        error: "status inválido"
      });
      return;
    }

    status = statusRaw;
  }

  try {
    const rows = await listSpecialRequests({
      status,
      query: getOptionalString(req.query?.q),
      limit: parseLimit(req.query?.limit)
    });

    res.json({
      success: true,
      data: rows
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron cargar los pedidos especiales"
    });
  }
};

export const getAdminSpecialRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  try {
    const row = await getSpecialRequestById(id);
    if (!row) {
      res.status(404).json({
        success: false,
        error: "Pedido especial no encontrado"
      });
      return;
    }

    res.json({
      success: true,
      data: row
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo cargar el pedido especial"
    });
  }
};

export const patchAdminSpecialRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseId(req.params?.id);
  if (id === null) {
    res.status(400).json({
      success: false,
      error: "id inválido"
    });
    return;
  }

  const source = (req.body ?? {}) as Record<string, unknown>;
  const hasStatus = "status" in source;
  const hasAdminNotes = "adminNotes" in source;
  if (!hasStatus && !hasAdminNotes) {
    res.status(400).json({
      success: false,
      error: "Debe enviarse status y/o adminNotes"
    });
    return;
  }

  let status: SpecialRequestStatus | undefined;
  if (hasStatus) {
    if (!isSpecialRequestStatus(source.status)) {
      res.status(400).json({
        success: false,
        error: "status inválido"
      });
      return;
    }

    status = source.status;
  }

  let adminNotes: string | null | undefined;
  if (hasAdminNotes) {
    if (source.adminNotes === null) {
      adminNotes = null;
    } else if (typeof source.adminNotes === "string") {
      adminNotes = source.adminNotes;
    } else {
      res.status(400).json({
        success: false,
        error: "adminNotes inválido"
      });
      return;
    }
  }

  try {
    const updated = await updateSpecialRequest(id, {
      status,
      adminNotes,
      reviewedByUserId: req.authUser?.userId,
      reviewedByEmail: req.authUser?.email ?? req.authUser?.displayName
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: "Pedido especial no encontrado"
      });
      return;
    }

    res.json({
      success: true,
      message: "Pedido especial actualizado",
      data: updated
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar el pedido especial"
    });
  }
};
