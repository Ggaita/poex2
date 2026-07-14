import type { Request, Response } from "express";
import {
  createManualNotifications,
  isEmailTemplateKey,
  listCommunicationRecipients,
  listEmailOutboxEntries,
  listEmailTemplates,
  updateEmailTemplate
} from "../services/communications.service";
import type {
  EmailTemplatePatch,
  ManualNotificationInput,
  NotificationTargetMode
} from "../types/communications.types";

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const parseNotificationTargetMode = (
  value: unknown
): NotificationTargetMode | undefined => {
  if (value === "all" || value === "group" || value === "selected") {
    return value;
  }

  return undefined;
};

export const getAdminEmailTemplates = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const templates = await listEmailTemplates();
    res.json({
      success: true,
      data: templates
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron cargar las plantillas de correo"
    });
  }
};

export const patchAdminEmailTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const key = req.params?.key;
  if (!isEmailTemplateKey(key)) {
    res.status(400).json({
      success: false,
      error: "templateKey inválido"
    });
    return;
  }

  const patch: EmailTemplatePatch = {};
  if ("subjectTemplate" in (req.body ?? {})) {
    if (typeof req.body?.subjectTemplate !== "string") {
      res.status(400).json({
        success: false,
        error: "subjectTemplate inválido"
      });
      return;
    }
    patch.subjectTemplate = req.body.subjectTemplate;
  }

  if ("bodyTemplate" in (req.body ?? {})) {
    if (typeof req.body?.bodyTemplate !== "string") {
      res.status(400).json({
        success: false,
        error: "bodyTemplate inválido"
      });
      return;
    }
    patch.bodyTemplate = req.body.bodyTemplate;
  }

  if ("isActive" in (req.body ?? {})) {
    if (typeof req.body?.isActive !== "boolean") {
      res.status(400).json({
        success: false,
        error: "isActive inválido"
      });
      return;
    }
    patch.isActive = req.body.isActive;
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({
      success: false,
      error: "Debe enviarse al menos un campo para actualizar"
    });
    return;
  }

  if (
    typeof patch.subjectTemplate === "string" &&
    patch.subjectTemplate.trim().length === 0
  ) {
    res.status(400).json({
      success: false,
      error: "El asunto no puede quedar vacío"
    });
    return;
  }

  if (
    typeof patch.bodyTemplate === "string" &&
    patch.bodyTemplate.trim().length === 0
  ) {
    res.status(400).json({
      success: false,
      error: "El cuerpo del correo no puede quedar vacío"
    });
    return;
  }

  try {
    const template = await updateEmailTemplate(key, patch);
    if (!template) {
      res.status(404).json({
        success: false,
        error: "Plantilla no encontrada"
      });
      return;
    }

    res.json({
      success: true,
      message: "Plantilla actualizada",
      data: template
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo actualizar la plantilla"
    });
  }
};

export const getAdminCommunicationRecipients = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const catalog = await listCommunicationRecipients();
    res.json({
      success: true,
      data: catalog
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron cargar destinatarios"
    });
  }
};

export const postAdminManualNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const source = (req.body ?? {}) as Record<string, unknown>;

  if (!isEmailTemplateKey(source.templateKey)) {
    res.status(400).json({
      success: false,
      error: "templateKey inválido"
    });
    return;
  }

  const targetMode = parseNotificationTargetMode(source.targetMode);
  if (!targetMode) {
    res.status(400).json({
      success: false,
      error: "targetMode inválido"
    });
    return;
  }

  const profileIds = Array.isArray(source.profileIds)
    ? source.profileIds
        .map((value) =>
          typeof value === "number" ? value : Number.parseInt(String(value), 10)
        )
        .filter((value) => Number.isFinite(value))
    : [];

  const groupValues = Array.isArray(source.groupValues)
    ? source.groupValues
        .map((value) => getOptionalString(value) ?? "")
        .filter((value) => value.length > 0)
    : [];

  if (targetMode === "selected" && profileIds.length === 0) {
    res.status(400).json({
      success: false,
      error: "Debés seleccionar al menos una empresa para enviar"
    });
    return;
  }

  if (targetMode === "group") {
    const groupBy = source.groupBy;
    if (groupBy !== "sector") {
      res.status(400).json({
        success: false,
        error: "groupBy inválido"
      });
      return;
    }

    if (groupValues.length === 0) {
      res.status(400).json({
        success: false,
        error: "Debés seleccionar al menos un grupo"
      });
      return;
    }
  }

  const messageTitle = getOptionalString(source.messageTitle);
  const messageBody = getOptionalString(source.messageBody);
  if (source.templateKey === "general_information") {
    if (!messageTitle || !messageBody) {
      res.status(400).json({
        success: false,
        error: "Para notificación general, título y mensaje son obligatorios"
      });
      return;
    }
  }

  const payload: ManualNotificationInput = {
    templateKey: source.templateKey,
    targetMode,
    groupBy: source.groupBy === "sector" ? "sector" : undefined,
    groupValues,
    profileIds,
    messageTitle,
    messageBody
  };

  try {
    const result = await createManualNotifications(payload, {
      userId: req.authUser?.userId,
      email: req.authUser?.email,
      displayName: req.authUser?.displayName
    });

    res.status(201).json({
      success: true,
      message: `Se prepararon ${result.createdCount} correos`,
      data: result
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron preparar las notificaciones"
    });
  }
};

export const getAdminEmailOutbox = async (
  req: Request,
  res: Response
): Promise<void> => {
  const limitRaw = Number.parseInt(String(req.query?.limit ?? "40"), 10);
  const limit = Number.isNaN(limitRaw) ? 40 : Math.max(1, Math.min(200, limitRaw));

  try {
    const entries = await listEmailOutboxEntries(limit);
    res.json({
      success: true,
      data: entries
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo cargar la bandeja de correos preparados"
    });
  }
};
