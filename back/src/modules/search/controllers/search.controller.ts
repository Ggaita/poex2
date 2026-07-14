import type { Request, Response } from "express";
import { searchApprovedProfiles } from "../services/search.service";
import type { SearchMode } from "../types/search.types";

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

const parseMode = (value: unknown): SearchMode => {
  if (value === "company" || value === "product") {
    return value;
  }
  return "all";
};

export const searchPublicProfiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = getQueryString(req.query?.q);
  const limit = parseLimit(req.query?.limit);
  const mode = parseMode(req.query?.mode);

  if (!query && mode === "all") {
    res.json({
      success: true,
      data: {
        query: "",
        mode,
        total: 0,
        results: []
      }
    });
    return;
  }

  try {
    const result = await searchApprovedProfiles(query, limit, mode);

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
