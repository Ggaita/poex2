import type { Request, Response } from "express";
import { getPublicProductById } from "../../profiles/services/profiles.service";

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getPublicProductDetail = async (
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
    const product = await getPublicProductById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: "Producto público no encontrado"
      });
      return;
    }

    res.json({
      success: true,
      data: product
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener el producto público"
    });
  }
};
