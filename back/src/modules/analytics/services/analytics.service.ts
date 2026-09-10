import {
  AnalyticsEventName as PrismaEventName,
  Prisma,
  type AnalyticsEvent as DbAnalyticsEvent
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import type {
  AnalyticsDailyPoint,
  AnalyticsEventInput,
  AnalyticsEventName,
  AnalyticsFunnel,
  AnalyticsLast24h,
  AnalyticsNamedCount,
  AnalyticsPathCount,
  AnalyticsSummary
} from "../types/analytics.types";

const toPrismaEventName = (name: AnalyticsEventName): PrismaEventName => {
  switch (name) {
    case "page_view":
      return PrismaEventName.page_view;
    case "search":
      return PrismaEventName.search;
    case "company_view":
      return PrismaEventName.company_view;
    case "product_view":
      return PrismaEventName.product_view;
    case "cta_click":
      return PrismaEventName.cta_click;
    case "inquiry_submit":
      return PrismaEventName.inquiry_submit;
  }
};

const trimOrNull = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 500) : null;
};

const parseOccurredAt = (value?: string | null): Date => {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  // Ignore future timestamps drifting > 10 min
  const maxFuture = Date.now() + 10 * 60 * 1000;
  if (parsed.getTime() > maxFuture) return new Date();
  return parsed;
};

const monthBounds = (month: string): { from: Date; to: Date; label: string } => {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  const now = new Date();
  let year = now.getUTCFullYear();
  let mon = now.getUTCMonth();
  if (match) {
    year = Number.parseInt(match[1], 10);
    mon = Number.parseInt(match[2], 10) - 1;
  }
  const from = new Date(Date.UTC(year, mon, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, mon + 1, 1, 0, 0, 0, 0));
  const label = `${year}-${String(mon + 1).padStart(2, "0")}`;
  return { from, to, label };
};

const countBy = (
  rows: DbAnalyticsEvent[],
  pick: (row: DbAnalyticsEvent) => string | null | undefined,
  limit = 10
): AnalyticsNamedCount[] => {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const key = pick(row)?.trim();
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return [...map.entries()]
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"))
    .slice(0, limit);
};

const normalizePathForJourney = (path?: string | null): string | null => {
  if (!path) return null;
  const cleaned = path.trim();
  if (!cleaned) return null;
  // Quitar querystring para paths más legibles
  const noQuery = cleaned.split("?")[0] || cleaned;
  return noQuery.slice(0, 120);
};

const detectDevice = (userAgent?: string | null): string => {
  if (!userAgent) return "Desconocido";
  const ua = userAgent.toLowerCase();
  if (/bot|crawler|spider|slurp|bingpreview/i.test(ua)) return "Bot";
  if (/ipad|tablet|kindle|playbook|silk|(android(?!.*mobile))/i.test(ua)) return "Tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|opera mini/i.test(ua)) return "Móvil";
  return "Escritorio";
};

const pct = (part: number, whole: number): number => {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
};

/** Funnel por sesión: search → company_view → inquiry_submit */
const buildConversionFunnel = (rows: DbAnalyticsEvent[]): AnalyticsFunnel => {
  const bySession = new Map<string, Set<string>>();
  rows.forEach((row) => {
    const name = String(row.eventName);
    if (name !== "search" && name !== "company_view" && name !== "inquiry_submit") {
      return;
    }
    if (!bySession.has(row.sessionKey)) {
      bySession.set(row.sessionKey, new Set());
    }
    bySession.get(row.sessionKey)!.add(name);
  });

  let stepSearch = 0;
  let stepCompany = 0;
  let stepInquiry = 0;
  bySession.forEach((events) => {
    const hasSearch = events.has("search");
    const hasCompany = events.has("company_view");
    const hasInquiry = events.has("inquiry_submit");
    if (hasSearch) stepSearch += 1;
    if (hasSearch && hasCompany) stepCompany += 1;
    if (hasSearch && hasCompany && hasInquiry) stepInquiry += 1;
  });

  const start = stepSearch;
  return {
    id: "search_to_inquiry",
    label: "Búsqueda → empresa → consulta",
    description:
      "Sesiones que buscan, luego ven una ficha de empresa y envían una solicitud de información.",
    steps: [
      {
        key: "search",
        label: "Buscaron",
        sessions: stepSearch,
        rateFromStart: pct(stepSearch, start || stepSearch),
        rateFromPrevious: 100
      },
      {
        key: "company_view",
        label: "Vieron empresa",
        sessions: stepCompany,
        rateFromStart: pct(stepCompany, start),
        rateFromPrevious: pct(stepCompany, stepSearch)
      },
      {
        key: "inquiry_submit",
        label: "Enviaron consulta",
        sessions: stepInquiry,
        rateFromStart: pct(stepInquiry, start),
        rateFromPrevious: pct(stepInquiry, stepCompany)
      }
    ]
  };
};

/** Top paths de page_view por sesión (secuencias de 2–3 pasos). */
const buildTopPaths = (rows: DbAnalyticsEvent[], limit = 10): AnalyticsPathCount[] => {
  const bySession = new Map<string, string[]>();
  rows
    .filter((row) => row.eventName === PrismaEventName.page_view)
    .forEach((row) => {
      const path = normalizePathForJourney(row.path);
      if (!path) return;
      const list = bySession.get(row.sessionKey) ?? [];
      const last = list[list.length - 1];
      if (last === path) return; // colapsar refreshes del mismo path
      list.push(path);
      bySession.set(row.sessionKey, list);
    });

  const map = new Map<string, number>();
  bySession.forEach((paths) => {
    if (paths.length < 2) return;
    const maxLen = Math.min(3, paths.length);
    for (let len = 2; len <= maxLen; len += 1) {
      for (let i = 0; i <= paths.length - len; i += 1) {
        const slice = paths.slice(i, i + len);
        const key = slice.join(" → ");
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
  });

  return [...map.entries()]
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"))
    .slice(0, limit);
};

const buildLast24h = (rows: DbAnalyticsEvent[]): AnalyticsLast24h => {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  const windowRows = rows.filter(
    (row) => row.occurredAt >= from && row.occurredAt <= to
  );
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    events: windowRows.length,
    visitors: new Set(windowRows.map((r) => r.visitorKey)).size,
    sessions: new Set(windowRows.map((r) => r.sessionKey)).size,
    pageViews: windowRows.filter((r) => r.eventName === PrismaEventName.page_view).length,
    searches: windowRows.filter((r) => r.eventName === PrismaEventName.search).length,
    companyViews: windowRows.filter((r) => r.eventName === PrismaEventName.company_view).length,
    inquirySubmits: windowRows.filter((r) => r.eventName === PrismaEventName.inquiry_submit)
      .length
  };
};

export const createAnalyticsEvents = async (
  events: AnalyticsEventInput[]
): Promise<number> => {
  if (events.length === 0) return 0;

  const data: Prisma.AnalyticsEventCreateManyInput[] = events.map((event) => ({
    eventName: toPrismaEventName(event.eventName),
    path: trimOrNull(event.path),
    pageTitle: trimOrNull(event.pageTitle),
    searchQuery: trimOrNull(event.searchQuery)?.toLowerCase() ?? null,
    searchMode: trimOrNull(event.searchMode),
    profileId:
      typeof event.profileId === "number" && Number.isFinite(event.profileId)
        ? Math.floor(event.profileId)
        : null,
    productId:
      typeof event.productId === "number" && Number.isFinite(event.productId)
        ? Math.floor(event.productId)
        : null,
    productName: trimOrNull(event.productName),
    companyName: trimOrNull(event.companyName),
    ctaName: trimOrNull(event.ctaName),
    referrer: trimOrNull(event.referrer)?.slice(0, 1000) ?? null,
    userAgent: trimOrNull(event.userAgent)?.slice(0, 500) ?? null,
    sessionKey: event.sessionKey.trim().slice(0, 120),
    visitorKey: event.visitorKey.trim().slice(0, 120),
    metadata:
      event.metadata && typeof event.metadata === "object"
        ? (event.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    occurredAt: parseOccurredAt(event.occurredAt)
  }));

  const result = await prisma.analyticsEvent.createMany({ data });
  return result.count;
};

export const getAnalyticsSummary = async (month?: string): Promise<AnalyticsSummary> => {
  const { from, to, label } = monthBounds(month ?? "");
  const last24From = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [rows, recentRows] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        occurredAt: {
          gte: from,
          lt: to
        }
      },
      orderBy: { occurredAt: "asc" }
    }),
    prisma.analyticsEvent.findMany({
      where: {
        occurredAt: {
          gte: last24From
        }
      },
      orderBy: { occurredAt: "asc" }
    })
  ]);

  const pageViews = rows.filter((r) => r.eventName === PrismaEventName.page_view);
  const searches = rows.filter((r) => r.eventName === PrismaEventName.search);
  const companyViews = rows.filter((r) => r.eventName === PrismaEventName.company_view);
  const productViews = rows.filter((r) => r.eventName === PrismaEventName.product_view);
  const ctaClicks = rows.filter((r) => r.eventName === PrismaEventName.cta_click);
  const inquirySubmits = rows.filter((r) => r.eventName === PrismaEventName.inquiry_submit);

  const visitors = new Set(rows.map((r) => r.visitorKey)).size;
  const sessions = new Set(rows.map((r) => r.sessionKey)).size;

  const dayMap = new Map<string, AnalyticsDailyPoint>();
  const ensureDay = (isoDay: string): AnalyticsDailyPoint => {
    const existing = dayMap.get(isoDay);
    if (existing) return existing;
    const created: AnalyticsDailyPoint = {
      date: isoDay,
      pageViews: 0,
      visitors: 0,
      searches: 0,
      companyViews: 0,
      productViews: 0,
      ctaClicks: 0,
      inquirySubmits: 0
    };
    dayMap.set(isoDay, created);
    return created;
  };

  const visitorsByDay = new Map<string, Set<string>>();
  rows.forEach((row) => {
    const day = row.occurredAt.toISOString().slice(0, 10);
    const point = ensureDay(day);
    if (row.eventName === PrismaEventName.page_view) point.pageViews += 1;
    if (row.eventName === PrismaEventName.search) point.searches += 1;
    if (row.eventName === PrismaEventName.company_view) point.companyViews += 1;
    if (row.eventName === PrismaEventName.product_view) point.productViews += 1;
    if (row.eventName === PrismaEventName.cta_click) point.ctaClicks += 1;
    if (row.eventName === PrismaEventName.inquiry_submit) point.inquirySubmits += 1;
    if (!visitorsByDay.has(day)) visitorsByDay.set(day, new Set());
    visitorsByDay.get(day)!.add(row.visitorKey);
  });
  visitorsByDay.forEach((set, day) => {
    ensureDay(day).visitors = set.size;
  });

  // Fill empty days in month for stable charts
  const cursor = new Date(from);
  while (cursor < to) {
    const day = cursor.toISOString().slice(0, 10);
    ensureDay(day);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const daily = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  const emptySearches = countBy(
    searches.filter((row) => {
      const meta = row.metadata;
      if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
      return (meta as Record<string, unknown>).resultCount === 0;
    }),
    (row) => row.searchQuery
  );

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    month: label,
    totals: {
      pageViews: pageViews.length,
      visitors,
      sessions,
      searches: searches.length,
      companyViews: companyViews.length,
      productViews: productViews.length,
      ctaClicks: ctaClicks.length,
      inquirySubmits: inquirySubmits.length
    },
    daily,
    trendMetrics: [
      { key: "pageViews", label: "Visitas" },
      { key: "visitors", label: "Visitantes" },
      { key: "searches", label: "Búsquedas" },
      { key: "companyViews", label: "Vistas empresa" },
      { key: "productViews", label: "Vistas producto" },
      { key: "ctaClicks", label: "Clics CTA" },
      { key: "inquirySubmits", label: "Consultas" }
    ],
    funnel: buildConversionFunnel(rows),
    topPaths: buildTopPaths(rows),
    searchModes: countBy(searches, (row) => row.searchMode || "sin_modo"),
    devices: countBy(rows, (row) => detectDevice(row.userAgent)),
    last24h: buildLast24h(recentRows),
    topPages: countBy(pageViews, (row) => row.path),
    topCompanies: countBy(
      companyViews,
      (row) =>
        row.companyName ||
        (row.profileId ? `Empresa #${row.profileId}` : row.path || undefined)
    ),
    topProducts: countBy(
      productViews,
      (row) =>
        row.productName ||
        (row.productId ? `Producto #${row.productId}` : undefined)
    ),
    topSearches: countBy(searches, (row) => row.searchQuery),
    emptySearches,
    topCtas: countBy(ctaClicks, (row) => row.ctaName || row.path || undefined)
  };
};

export const listAvailableAnalyticsMonths = async (): Promise<string[]> => {
  const rows = await prisma.analyticsEvent.findMany({
    select: { occurredAt: true },
    orderBy: { occurredAt: "desc" },
    take: 5000
  });
  const set = new Set<string>();
  rows.forEach((row) => {
    set.add(row.occurredAt.toISOString().slice(0, 7));
  });
  // Always include current month
  set.add(new Date().toISOString().slice(0, 7));
  return [...set].sort((a, b) => b.localeCompare(a));
};

export type AnalyticsExportScope = "month" | "year" | "all";

export type AnalyticsExportResult = {
  scope: AnalyticsExportScope;
  label: string;
  from: string | null;
  to: string | null;
  rowCount: number;
  filename: string;
  csv: string;
};

const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const resolveExportRange = (
  scope: AnalyticsExportScope,
  period?: string
): { from: Date | null; to: Date | null; label: string; filenameStem: string } => {
  const now = new Date();

  if (scope === "all") {
    return {
      from: null,
      to: null,
      label: "total",
      filenameStem: "poex-analytics-eventos-total"
    };
  }

  if (scope === "year") {
    const yearMatch = /^(\d{4})$/.exec(period ?? "");
    const year = yearMatch
      ? Number.parseInt(yearMatch[1], 10)
      : now.getUTCFullYear();
    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
    return {
      from,
      to,
      label: String(year),
      filenameStem: `poex-analytics-eventos-${year}`
    };
  }

  const { from, to, label } = monthBounds(period ?? "");
  return {
    from,
    to,
    label,
    filenameStem: `poex-analytics-eventos-${label}`
  };
};

/**
 * Exporta eventos crudos en CSV (UTF-8 con BOM).
 * Cada fila trae fecha completa + campos derivados (date/year/month)
 * para que luego se filtren en R/Excel sin perder granularidad.
 */
export const exportAnalyticsEventsCsv = async (
  scope: AnalyticsExportScope = "month",
  period?: string
): Promise<AnalyticsExportResult> => {
  const range = resolveExportRange(scope, period);
  const where =
    range.from && range.to
      ? {
          occurredAt: {
            gte: range.from,
            lt: range.to
          }
        }
      : undefined;

  const rows = await prisma.analyticsEvent.findMany({
    where,
    orderBy: [{ occurredAt: "asc" }, { id: "asc" }]
  });

  const headers = [
    "id",
    "occurred_at",
    "date",
    "year",
    "month",
    "year_month",
    "event_name",
    "path",
    "page_title",
    "search_query",
    "search_mode",
    "profile_id",
    "product_id",
    "product_name",
    "company_name",
    "cta_name",
    "visitor_key",
    "session_key",
    "referrer",
    "user_agent",
    "metadata_json",
    "result_count"
  ];

  const lines = [headers.join(",")];

  rows.forEach((row) => {
    const iso = row.occurredAt.toISOString();
    const date = iso.slice(0, 10);
    const year = date.slice(0, 4);
    const month = date.slice(5, 7);
    const yearMonth = date.slice(0, 7);
    const meta =
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null;
    const resultCount =
      meta && typeof meta.resultCount === "number" && Number.isFinite(meta.resultCount)
        ? meta.resultCount
        : "";

    lines.push(
      [
        row.id,
        iso,
        date,
        year,
        month,
        yearMonth,
        row.eventName,
        row.path ?? "",
        row.pageTitle ?? "",
        row.searchQuery ?? "",
        row.searchMode ?? "",
        row.profileId ?? "",
        row.productId ?? "",
        row.productName ?? "",
        row.companyName ?? "",
        row.ctaName ?? "",
        row.visitorKey,
        row.sessionKey,
        row.referrer ?? "",
        row.userAgent ?? "",
        meta ? JSON.stringify(meta) : "",
        resultCount
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  });

  // BOM para Excel + UTF-8; R lo lee bien con readr::read_csv.
  const csv = `${String.fromCharCode(0xfeff)}${lines.join("\r\n")}\r\n`;

  return {
    scope,
    label: range.label,
    from: range.from ? range.from.toISOString() : null,
    to: range.to ? range.to.toISOString() : null,
    rowCount: rows.length,
    filename: `${range.filenameStem}.csv`,
    csv
  };
};
