import type { Request, Response } from "express";
import { searchApprovedProfiles } from "../services/search.service";
import type {
  SearchFilters,
  SearchHasPaFilter,
  SearchMode,
  SearchResultKindFilter
} from "../types/search.types";

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

const parseKindFilter = (value: unknown): SearchResultKindFilter | undefined => {
  if (value === "company" || value === "product" || value === "all") {
    return value;
  }
  return undefined;
};

const parseHasPaFilter = (value: unknown): SearchHasPaFilter | undefined => {
  if (value === "yes" || value === "no" || value === "all") {
    return value;
  }
  return undefined;
};

const parseFilters = (query: Request["query"]): SearchFilters => {
  const filters: SearchFilters = {};
  const sector = getQueryString(query?.sector);
  const city = getQueryString(query?.city);
  const kind = parseKindFilter(query?.kind);
  const hasPa = parseHasPaFilter(query?.hasPa);

  if (sector) {
    filters.sector = sector;
  }
  if (city) {
    filters.city = city;
  }
  if (kind) {
    filters.kind = kind;
  }
  if (hasPa) {
    filters.hasPa = hasPa;
  }
  return filters;
};

const emptySearchPayload = (mode: SearchMode, filters: SearchFilters) => ({
  query: "",
  mode,
  total: 0,
  filters: {
    sector: filters.sector ?? "",
    city: filters.city ?? "",
    kind: filters.kind ?? "all",
    hasPa: filters.hasPa ?? "all"
  },
  facets: {
    kinds: [{ value: "all", label: "Todos", count: 0 }],
    sectors: [],
    cities: [],
    hasPa: [{ value: "all", label: "Todas", count: 0 }]
  },
  results: []
});

export const searchPublicProfiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = getQueryString(req.query?.q);
  const limit = parseLimit(req.query?.limit);
  const mode = parseMode(req.query?.mode);
  const filters = parseFilters(req.query);

  if (!query && mode === "all") {
    res.json({
      success: true,
      data: emptySearchPayload(mode, filters)
    });
    return;
  }

  try {
    const result = await searchApprovedProfiles(query, limit, mode, filters);

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
