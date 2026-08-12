import type { Request, Response } from "express";
import {
  getUploadedFilename,
  toPublicUploadUrl,
  type UploadKind
} from "../../../lib/uploads";

const respondUpload = (req: Request, res: Response, kind: UploadKind): void => {
  const filename = getUploadedFilename(req);
  if (!filename) {
    res.status(400).json({
      success: false,
      error: "No se recibió un archivo de imagen válido"
    });
    return;
  }

  const url = toPublicUploadUrl(kind, filename);

  res.status(201).json({
    success: true,
    message: "Imagen subida correctamente",
    data: {
      url,
      kind,
      filename,
      originalName: req.file?.originalname ?? null,
      mimeType: req.file?.mimetype ?? null,
      size: req.file?.size ?? null
    }
  });
};

export const postLogoUpload = (req: Request, res: Response): void => {
  respondUpload(req, res, "logos");
};

export const postProductImageUpload = (req: Request, res: Response): void => {
  respondUpload(req, res, "products");
};

export const handleUploadError = (
  error: unknown,
  _req: Request,
  res: Response
): void => {
  if (error instanceof Error) {
    const message = error.message || "No se pudo subir la imagen";
    const isLimit = message.toLowerCase().includes("file too large");
    res.status(isLimit ? 413 : 400).json({
      success: false,
      error: isLimit
        ? "La imagen supera el máximo permitido de 3 MB"
        : message
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: "No se pudo subir la imagen"
  });
};
