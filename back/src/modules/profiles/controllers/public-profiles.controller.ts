import type { Request, Response } from "express";
import { getPublicProfileById, listPublicProfiles } from "../services/profiles.service";

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getPublicProfiles = async (req: Request, res: Response): Promise<void> => {
  const query = getOptionalString(req.query?.q);

  try {
    const rows = await listPublicProfiles(query);
    res.json({
      success: true,
      data: rows
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron obtener los perfiles públicos"
    });
  }
};

export const getPublicProfileDetail = async (
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
    const profile = await getPublicProfileById(id);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: "Perfil público no encontrado"
      });
      return;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener el perfil público"
    });
  }
};
