import type { Request, Response } from "express";
import { searchApprovedProfiles } from "../services/search.service";

const getQueryString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const parseLimit = (value: unknown): number => {
  if (typeof value !== "string") {
    return 24;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 24;
  }

  return Math.min(parsed, 100);
};

export const searchPublicProfiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = getQueryString(req.query?.q);
  const limit = parseLimit(req.query?.limit);

  if (!query) {
    res.json({
      success: true,
      data: {
        query: "",
        total: 0,
        results: []
      }
    });
    return;
  }

  try {
    const result = await searchApprovedProfiles(query, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: "No se pudo ejecutar la búsqueda"
    });
  }
};
