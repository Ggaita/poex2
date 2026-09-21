import type { Request, Response } from "express";
import {
  getPublicIndustrialParkBySlug,
  listPublicIndustrialParks
} from "../services/industrial-parks.service";

export const getPublicIndustrialParks = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await listPublicIndustrialParks();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron cargar los parques industriales"
    });
  }
};

export const getPublicIndustrialParkDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const slug = typeof req.params.slug === "string" ? req.params.slug.trim() : "";
  if (!slug) {
    res.status(400).json({ success: false, error: "slug inválido" });
    return;
  }

  try {
    const data = await getPublicIndustrialParkBySlug(slug);
    if (!data) {
      res.status(404).json({ success: false, error: "Parque no encontrado" });
      return;
    }
    res.json({ success: true, data });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo cargar el parque industrial"
    });
  }
};
