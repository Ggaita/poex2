import fs from "fs";
import path from "path";
import multer from "multer";
import type { Request } from "express";

export type UploadKind = "logos" | "products";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(path.join(uploadsRoot, "logos"));
ensureDir(path.join(uploadsRoot, "products"));

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
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
        ".jpg";
      const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
        ? ext === ".jpeg"
          ? ".jpg"
          : ext
        : ".jpg";
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${kind.slice(0, -1)}-${unique}${safeExt}`);
    }
  });

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));
    return;
  }
  cb(null, true);
};

export const logoUpload = multer({
  storage: createStorage("logos"),
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});

export const productUpload = multer({
  storage: createStorage("products"),
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
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
