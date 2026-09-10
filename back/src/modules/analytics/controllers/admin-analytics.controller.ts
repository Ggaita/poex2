import type { Request, Response } from "express";
import {
  exportAnalyticsEventsCsv,
  getAnalyticsSummary,
  listAvailableAnalyticsMonths,
  type AnalyticsExportScope
} from "../services/analytics.service";

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const parseExportScope = (value: unknown): AnalyticsExportScope => {
  if (value === "year" || value === "all" || value === "month") {
    return value;
  }
  return "month";
};

export const getAdminAnalyticsSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const month = getOptionalString(req.query?.month);
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ success: false, error: "month inválido (YYYY-MM)" });
    return;
  }

  try {
    const [summary, months] = await Promise.all([
      getAnalyticsSummary(month),
      listAvailableAnalyticsMonths()
    ]);
    res.json({
      success: true,
      data: {
        ...summary,
        availableMonths: months
      }
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo obtener el resumen de analítica"
    });
  }
};

/**
 * CSV de eventos crudos para análisis externo (R, Excel, Power BI).
 * Query:
 * - scope=month|year|all (default month)
 * - period=YYYY-MM (month) | YYYY (year) | omitido en all
 */
export const getAdminAnalyticsExportCsv = async (
  req: Request,
  res: Response
): Promise<void> => {
  const scope = parseExportScope(req.query?.scope);
  const period = getOptionalString(req.query?.period) ?? getOptionalString(req.query?.month);

  if (scope === "month" && period && !/^\d{4}-\d{2}$/.test(period)) {
    res.status(400).json({ success: false, error: "period inválido para mes (YYYY-MM)" });
    return;
  }
  if (scope === "year" && period && !/^\d{4}$/.test(period)) {
    res.status(400).json({ success: false, error: "period inválido para año (YYYY)" });
    return;
  }

  try {
    const exported = await exportAnalyticsEventsCsv(scope, period);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exported.filename}"`
    );
    res.setHeader("X-POEX-Export-Scope", exported.scope);
    res.setHeader("X-POEX-Export-Label", exported.label);
    res.setHeader("X-POEX-Export-Rows", String(exported.rowCount));
    res.status(200).send(exported.csv);
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudo exportar la analítica en CSV"
    });
  }
};
