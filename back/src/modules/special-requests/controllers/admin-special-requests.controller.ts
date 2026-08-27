import type { Request, Response } from "express";
import { replyToInfoRequest } from "../../communications/services/communications.service";
import {
  countPendingSpecialRequests,
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

export const getAdminSpecialRequestsPendingCount = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const count = await countPendingSpecialRequests();
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

export const postAdminSpecialRequestReplyEmail = async (
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
  const subject = getOptionalString(source.subject);
  const messageBody = getOptionalString(source.messageBody);
  const markResolved = source.markResolved !== false;

  if (!subject || !messageBody) {
    res.status(400).json({
      success: false,
      error: "subject y messageBody son obligatorios"
    });
    return;
  }

  try {
    const request = await getSpecialRequestById(id);
    if (!request) {
      res.status(404).json({
        success: false,
        error: "Pedido especial no encontrado"
      });
      return;
    }

    const reply = await replyToInfoRequest(
      {
        requestId: request.id,
        recipientEmail: request.requesterEmail,
        recipientName: request.requesterName,
        subject,
        messageBody,
        companyName: request.profile?.companyName,
        productName: request.productName ?? request.requestedProduct,
        requesterCompany: request.requesterCompany
      },
      {
        userId: req.authUser?.userId,
        email: req.authUser?.email,
        displayName: req.authUser?.displayName
      }
    );

    let updatedRequest = request;
    if (markResolved) {
      const nextStatus: SpecialRequestStatus =
        reply.delivery.status === "sent" ? "resolved" : "forwarded";
      const notesPrefix =
        reply.delivery.status === "sent"
          ? "[Email enviado]"
          : reply.delivery.status === "prepared"
            ? "[Email preparado en outbox - SMTP no configurado]"
            : "[Email falló]";
      const composedNotes = [request.adminNotes, `${notesPrefix} ${subject}`]
        .filter(Boolean)
        .join("\n");

      updatedRequest =
        (await updateSpecialRequest(id, {
          status: nextStatus,
          adminNotes: composedNotes,
          reviewedByUserId: req.authUser?.userId,
          reviewedByEmail: req.authUser?.email ?? req.authUser?.displayName
        })) ?? request;
    }

    res.json({
      success: true,
      message:
        reply.delivery.status === "sent"
          ? "Respuesta enviada por email"
          : reply.delivery.status === "prepared"
            ? "Respuesta guardada en outbox (Outlook/SMTP pendiente de configurar)"
            : "No se pudo enviar el email",
      data: {
        request: updatedRequest,
        outbox: reply.outbox,
        delivery: reply.delivery
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_reply_payload") {
      res.status(400).json({
        success: false,
        error: "Datos de respuesta inválidos"
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "No se pudo preparar/enviar la respuesta por email"
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
