import fs from "fs";
import path from "path";
import multer from "multer";
import type { Request } from "express";

export type UploadKind = "logos" | "products" | "opportunities" | "documents";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(path.join(uploadsRoot, "logos"));
ensureDir(path.join(uploadsRoot, "products"));
ensureDir(path.join(uploadsRoot, "opportunities"));
ensureDir(path.join(uploadsRoot, "documents"));

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const allowedDocumentMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf"
};

const prefixByKind: Record<UploadKind, string> = {
  logos: "logo",
  products: "product",
  opportunities: "opportunity",
  documents: "document"
};

const createStorage = (kind: UploadKind) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const target = path.join(uploadsRoot, kind);
      ensureDir(target);
      cb(null, target);
    },
    filename: (_req, file, cb) => {
      const ext =
        extensionByMime[file.mimetype] ??
        path.extname(file.originalname).toLowerCase() ??
        ".bin";
      const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
      const safeExt = allowedExt.includes(ext)
        ? ext === ".jpeg"
          ? ".jpg"
          : ext
        : kind === "documents"
          ? ".pdf"
          : ".jpg";
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${prefixByKind[kind]}-${unique}${safeExt}`);
    }
  });

const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedImageMimeTypes.has(file.mimetype)) {
    cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));
    return;
  }
  cb(null, true);
};

const documentFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedDocumentMimeTypes.has(file.mimetype)) {
    cb(new Error("Solo se permiten PDF o imágenes JPG/PNG/WEBP"));
    return;
  }
  cb(null, true);
};

export const logoUpload = multer({
  storage: createStorage("logos"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});

export const productUpload = multer({
  storage: createStorage("products"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});

export const opportunityImageUpload = multer({
  storage: createStorage("opportunities"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const opportunityDocumentUpload = multer({
  storage: createStorage("documents"),
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

export const getUploadsRoot = (): string => uploadsRoot;

export const toPublicUploadUrl = (kind: UploadKind, filename: string): string => {
  return `/uploads/${kind}/${filename}`;
};

export const getUploadedFilename = (req: Request): string | null => {
  const file = req.file;
  if (!file || typeof file.filename !== "string" || file.filename.length === 0) {
    return null;
  }
  return file.filename;
};
