import type { Request, Response, NextFunction } from "express";
import {
  applicationAttachmentFields,
  applicationAttachmentUpload,
  toPublicUploadUrl
} from "../../../lib/uploads";
import { handleUploadError } from "../../uploads/controllers/uploads.controller";
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

type MulterFiles = {
  [fieldname: string]: Express.Multer.File[];
};

type AttachmentMetaItem = {
  title?: string;
  description?: string;
};

const parseJsonObject = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
};

const parseMetaList = (value: unknown): AttachmentMetaItem[] => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "object" && item !== null
        ? (item as AttachmentMetaItem)
        : {}
    );
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) =>
      typeof item === "object" && item !== null
        ? (item as AttachmentMetaItem)
        : {}
    );
  } catch {
    return [];
  }
};

const fileToAttachment = (
  file: Express.Multer.File,
  meta?: AttachmentMetaItem
) => {
  return {
    title: typeof meta?.title === "string" ? meta.title.trim() : "",
    description:
      typeof meta?.description === "string" ? meta.description.trim() : "",
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: toPublicUploadUrl("applications", file.filename)
  };
};

const readExistingFlag = (
  attachments: unknown,
  key: string
): string | undefined => {
  if (typeof attachments !== "object" || attachments === null) {
    return undefined;
  }
  const value = (attachments as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
};

const buildMessageWithAttachments = (
  req: Request,
  baseMessage: string | undefined
): string | undefined => {
  const files = (req.files ?? {}) as MulterFiles;
  const logoFile = files.logo?.[0];
  const catalogFiles = files.catalogs ?? [];
  const productPhotoFiles = files.productPhotos ?? [];
  const companyPhotoFiles = files.companyPhotos ?? [];
  const hasFiles =
    Boolean(logoFile) ||
    catalogFiles.length > 0 ||
    productPhotoFiles.length > 0 ||
    companyPhotoFiles.length > 0;

  const detailsFromBody = parseJsonObject(req.body?.details);
  const detailsFromMessage = parseJsonObject(baseMessage);

  // Compat: mensaje texto plano sin adjuntos (tests / clientes legacy)
  if (!hasFiles && !detailsFromBody && baseMessage && !detailsFromMessage) {
    return baseMessage;
  }

  if (!hasFiles && !detailsFromBody && !detailsFromMessage) {
    return baseMessage;
  }

  const details = { ...(detailsFromBody ?? detailsFromMessage ?? {}) };

  const catalogMeta = parseMetaList(req.body?.catalogMeta ?? details.catalogMeta);
  const productPhotoMeta = parseMetaList(
    req.body?.productPhotoMeta ?? details.productPhotoMeta
  );

  const logoAttachment = logoFile ? fileToAttachment(logoFile) : null;
  const catalogAttachments = catalogFiles.map((file, index) =>
    fileToAttachment(file, catalogMeta[index])
  );
  const productPhotoAttachments = productPhotoFiles.map((file, index) =>
    fileToAttachment(file, productPhotoMeta[index])
  );
  const companyPhotoAttachments = companyPhotoFiles.map((file) =>
    fileToAttachment(file)
  );

  const previousAttachments = details.attachments;
  const existingLinks =
    typeof details.links === "object" && details.links !== null
      ? (details.links as Record<string, unknown>)
      : {};

  const previousLogo =
    typeof previousAttachments === "object" &&
    previousAttachments !== null &&
    typeof (previousAttachments as Record<string, unknown>).logo === "object"
      ? ((previousAttachments as Record<string, unknown>).logo as Record<
          string,
          unknown
        >)
      : null;

  const resolvedLogo = logoAttachment
    ? {
        url: logoAttachment.url,
        originalName: logoAttachment.originalName,
        mimeType: logoAttachment.mimeType,
        size: logoAttachment.size
      }
    : previousLogo && typeof previousLogo.url === "string"
      ? previousLogo
      : null;

  details.links = {
    ...existingLinks,
    ...(typeof resolvedLogo?.url === "string" ? { logo: resolvedLogo.url } : {})
  };

  details.attachments = {
    logo: resolvedLogo,
    hasCatalog:
      catalogAttachments.length > 0
        ? "si"
        : (readExistingFlag(previousAttachments, "hasCatalog") ?? "no"),
    catalog: catalogAttachments.map((item) => ({
      title: item.title,
      url: item.url,
      originalName: item.originalName,
      mimeType: item.mimeType,
      size: item.size
    })),
    hasProductPhotos:
      productPhotoAttachments.length > 0
        ? "si"
        : (readExistingFlag(previousAttachments, "hasProductPhotos") ?? "no"),
    productPhotos: productPhotoAttachments.map((item) => ({
      description: item.description,
      url: item.url,
      originalName: item.originalName,
      mimeType: item.mimeType,
      size: item.size
    })),
    hasCompanyPhotos:
      companyPhotoAttachments.length > 0
        ? "si"
        : (readExistingFlag(previousAttachments, "hasCompanyPhotos") ?? "no"),
    companyPhotos: companyPhotoAttachments.map((item) => ({
      url: item.url,
      originalName: item.originalName,
      mimeType: item.mimeType,
      size: item.size
    }))
  };

  delete details.catalogMeta;
  delete details.productPhotoMeta;

  return JSON.stringify(details);
};

export const parseApplicationMultipart = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentType = String(req.headers["content-type"] ?? "");
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    next();
    return;
  }

  applicationAttachmentUpload.fields([...applicationAttachmentFields])(
    req,
    res,
    (error) => {
      if (error) {
        handleUploadError(error, req, res);
        return;
      }
      next();
    }
  );
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
  const rawMessage = getOptionalString(req.body?.message);
  const message = buildMessageWithAttachments(req, rawMessage);

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
        error: "Ya existe una solicitud con ese CUIT/taxId"
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
