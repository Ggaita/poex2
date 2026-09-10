import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../../layouts/PrivateLayout";
import { clearAuthSession, getAuthSession } from "../../../shared/auth/session";
import type { ApiResponse } from "../../../shared/types/api.types";
import "./AdminAnalyticsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type NamedCount = { key: string; label: string; count: number };
type DailyPoint = {
  date: string;
  pageViews: number;
  visitors: number;
  searches: number;
  companyViews: number;
  productViews: number;
  ctaClicks: number;
  inquirySubmits: number;
};
type TrendMetricKey = keyof Omit<DailyPoint, "date">;

type FunnelStep = {
  key: string;
  label: string;
  sessions: number;
  rateFromStart: number;
  rateFromPrevious: number;
};

type AnalyticsSummaryResponse = {
  month: string;
  from: string;
  to: string;
  availableMonths: string[];
  totals: {
    pageViews: number;
    visitors: number;
    sessions: number;
    searches: number;
    companyViews: number;
    productViews: number;
    ctaClicks: number;
    inquirySubmits: number;
  };
  daily: DailyPoint[];
  trendMetrics?: Array<{ key: TrendMetricKey; label: string }>;
  funnel?: {
    id: string;
    label: string;
    description: string;
    steps: FunnelStep[];
  };
  topPaths?: NamedCount[];
  searchModes?: NamedCount[];
  devices?: NamedCount[];
  last24h?: {
    from: string;
    to: string;
    events: number;
    visitors: number;
    sessions: number;
    pageViews: number;
    searches: number;
    companyViews: number;
    inquirySubmits: number;
  };
  topPages: NamedCount[];
  topCompanies: NamedCount[];
  topProducts: NamedCount[];
  topSearches: NamedCount[];
  emptySearches: NamedCount[];
  topCtas: NamedCount[];
};

const DEFAULT_TREND_METRICS: Array<{ key: TrendMetricKey; label: string }> = [
  { key: "pageViews", label: "Visitas" },
  { key: "visitors", label: "Visitantes" },
  { key: "searches", label: "Búsquedas" },
  { key: "companyViews", label: "Vistas empresa" },
  { key: "productViews", label: "Vistas producto" },
  { key: "ctaClicks", label: "Clics CTA" },
  { key: "inquirySubmits", label: "Consultas" }
];

const currentMonth = (): string => new Date().toISOString().slice(0, 7);

const formatMonthLabel = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(y, m - 1, 1)));
};

const TopList = ({
  title,
  rows,
  emptyLabel
}: {
  title: string;
  rows: NamedCount[];
  emptyLabel: string;
}) => {
  return (
    <article className="admin-analytics-panel">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="admin-analytics-empty">{emptyLabel}</p>
      ) : (
        <ol className="admin-analytics-rank">
          {rows.map((row) => (
            <li key={`${title}-${row.key}`}>
              <span title={row.label}>{row.label}</span>
              <strong>{row.count}</strong>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
};

type ExportScope = "month" | "year" | "all";

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const filenameFromDisposition = (header: string | null, fallback: string): string => {
  if (!header) return fallback;
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }
  const plainMatch = /filename="([^"]+)"/i.exec(header);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
};

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [exportScope, setExportScope] = useState<ExportScope>("month");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [trendMetric, setTrendMetric] = useState<TrendMetricKey>("pageViews");

  const handleUnauthorized = useCallback(() => {
    clearAuthSession();
    navigate("/login", { replace: true });
  }, [navigate]);

  const loadSummary = useCallback(
    async (nextMonth: string): Promise<void> => {
      const token = getAuthSession()?.token;
      if (!token) {
        handleUnauthorized();
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/analytics/summary?month=${encodeURIComponent(nextMonth)}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const payload = (await response.json()) as ApiResponse<AnalyticsSummaryResponse>;

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok || !payload.success || !payload.data) {
          setData(null);
          setErrorMessage(payload.error ?? "No se pudo cargar la analítica.");
          return;
        }

        setData(payload.data);
        if (payload.data.month) {
          setMonth(payload.data.month);
        }
      } catch {
        setData(null);
        setErrorMessage("No se pudo conectar con el backend de analítica.");
      } finally {
        setIsLoading(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    void loadSummary(month);
  }, [loadSummary, month]);

  const trendOptions = data?.trendMetrics?.length ? data.trendMetrics : DEFAULT_TREND_METRICS;

  const maxTrendValue = useMemo(() => {
    if (!data?.daily?.length) return 1;
    return Math.max(1, ...data.daily.map((d) => Number(d[trendMetric] ?? 0)));
  }, [data, trendMetric]);

  const trendLabel =
    trendOptions.find((item) => item.key === trendMetric)?.label ?? "Métrica";

  const monthOptions = data?.availableMonths?.length
    ? data.availableMonths
    : [currentMonth()];

  const exportPeriodLabel = useMemo(() => {
    if (exportScope === "all") return "todo el historial";
    if (exportScope === "year") return `año ${month.slice(0, 4)}`;
    return formatMonthLabel(month);
  }, [exportScope, month]);

  const handleExportCsv = useCallback(async (): Promise<void> => {
    const token = getAuthSession()?.token;
    if (!token) {
      handleUnauthorized();
      return;
    }

    setIsExporting(true);
    setExportMessage("");

    try {
      const params = new URLSearchParams();
      params.set("scope", exportScope);
      if (exportScope === "month") {
        params.set("period", month);
      } else if (exportScope === "year") {
        params.set("period", month.slice(0, 4));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/analytics/export.csv?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        let message = "No se pudo exportar el CSV.";
        try {
          const payload = (await response.json()) as ApiResponse<unknown>;
          if (payload.error) message = payload.error;
        } catch {
          // respuesta no JSON
        }
        setExportMessage(message);
        return;
      }

      const blob = await response.blob();
      const fallbackName =
        exportScope === "all"
          ? "poex-analytics-eventos-total.csv"
          : exportScope === "year"
            ? `poex-analytics-eventos-${month.slice(0, 4)}.csv`
            : `poex-analytics-eventos-${month}.csv`;
      const filename = filenameFromDisposition(
        response.headers.get("Content-Disposition"),
        fallbackName
      );
      const rowCount = response.headers.get("X-POEX-Export-Rows");
      downloadBlob(blob, filename);
      setExportMessage(
        rowCount
          ? `CSV descargado (${rowCount} eventos · ${exportPeriodLabel}).`
          : `CSV descargado · ${exportPeriodLabel}.`
      );
    } catch {
      setExportMessage("No se pudo conectar para exportar el CSV.");
    } finally {
      setIsExporting(false);
    }
  }, [exportScope, handleUnauthorized, month, exportPeriodLabel]);

  return (
    <PrivateLayout>
      <section className="admin-analytics-page">
        <div className="admin-analytics-shell">
          <header className="admin-analytics-header">
            <div>
              <p>Analítica del sitio</p>
              <h1>Dashboard de visitas y uso</h1>
              <small>
                Product analytics liviano: KPIs, funnel, trends, paths y export CSV para R.
              </small>
            </div>
            <div className="admin-analytics-header-actions">
              <label className="admin-analytics-month">
                Mes del dashboard
                <input
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </label>
              <div className="admin-analytics-export">
                <label>
                  Exportar CSV
                  <select
                    value={exportScope}
                    onChange={(event) => setExportScope(event.target.value as ExportScope)}
                  >
                    <option value="month">Mes seleccionado</option>
                    <option value="year">Año del mes seleccionado</option>
                    <option value="all">Total histórico</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="admin-analytics-export-btn"
                  onClick={() => void handleExportCsv()}
                  disabled={isExporting}
                >
                  {isExporting ? "Exportando..." : "Descargar CSV"}
                </button>
                <small>
                  Eventos crudos con fecha por fila (ideal para R/Excel). Período:{" "}
                  <strong>{exportPeriodLabel}</strong>.
                </small>
              </div>
            </div>
          </header>

          <div className="admin-analytics-month-chips">
            {monthOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={item === month ? "active" : ""}
                onClick={() => setMonth(item)}
              >
                {formatMonthLabel(item)}
              </button>
            ))}
          </div>

          {errorMessage ? <p className="admin-analytics-alert">{errorMessage}</p> : null}
          {exportMessage ? <p className="admin-analytics-export-msg">{exportMessage}</p> : null}
          {isLoading ? <p className="admin-analytics-empty">Cargando métricas...</p> : null}

          {!isLoading && data ? (
            <>
              {data.last24h ? (
                <section className="admin-analytics-live" aria-label="Últimas 24 horas">
                  <header>
                    <h2>Últimas 24 horas</h2>
                    <small>Ventana móvil independiente del mes seleccionado</small>
                  </header>
                  <div className="admin-analytics-live-grid">
                    <article>
                      <span>Eventos</span>
                      <strong>{data.last24h.events}</strong>
                    </article>
                    <article>
                      <span>Visitantes</span>
                      <strong>{data.last24h.visitors}</strong>
                    </article>
                    <article>
                      <span>Sesiones</span>
                      <strong>{data.last24h.sessions}</strong>
                    </article>
                    <article>
                      <span>Visitas</span>
                      <strong>{data.last24h.pageViews}</strong>
                    </article>
                    <article>
                      <span>Búsquedas</span>
                      <strong>{data.last24h.searches}</strong>
                    </article>
                    <article>
                      <span>Empresas</span>
                      <strong>{data.last24h.companyViews}</strong>
                    </article>
                    <article>
                      <span>Consultas</span>
                      <strong>{data.last24h.inquirySubmits}</strong>
                    </article>
                  </div>
                </section>
              ) : null}

              <div className="admin-analytics-kpis">
                <article>
                  <span>Visitas (page views)</span>
                  <strong>{data.totals.pageViews}</strong>
                </article>
                <article>
                  <span>Visitantes únicos</span>
                  <strong>{data.totals.visitors}</strong>
                </article>
                <article>
                  <span>Sesiones</span>
                  <strong>{data.totals.sessions}</strong>
                </article>
                <article>
                  <span>Búsquedas</span>
                  <strong>{data.totals.searches}</strong>
                </article>
                <article>
                  <span>Vistas de empresas</span>
                  <strong>{data.totals.companyViews}</strong>
                </article>
                <article>
                  <span>Vistas de productos</span>
                  <strong>{data.totals.productViews}</strong>
                </article>
                <article>
                  <span>Clics CTA</span>
                  <strong>{data.totals.ctaClicks}</strong>
                </article>
                <article>
                  <span>Consultas enviadas</span>
                  <strong>{data.totals.inquirySubmits}</strong>
                </article>
              </div>

              {data.funnel ? (
                <article className="admin-analytics-panel admin-analytics-funnel">
                  <header className="admin-analytics-funnel-head">
                    <div>
                      <h2>{data.funnel.label}</h2>
                      <small>{data.funnel.description}</small>
                    </div>
                  </header>
                  <ol className="admin-analytics-funnel-steps">
                    {data.funnel.steps.map((step, index) => (
                      <li key={step.key}>
                        <div className="admin-analytics-funnel-step-meta">
                          <span className="admin-analytics-funnel-index">{index + 1}</span>
                          <div>
                            <strong>{step.label}</strong>
                            <small>
                              {step.sessions} sesiones
                              {index > 0
                                ? ` · ${step.rateFromPrevious}% del paso anterior · ${step.rateFromStart}% del inicio`
                                : " · base del funnel"}
                            </small>
                          </div>
                          <em>{step.rateFromStart}%</em>
                        </div>
                        <div className="admin-analytics-funnel-bar-track" aria-hidden="true">
                          <div
                            className="admin-analytics-funnel-bar-fill"
                            style={{ width: `${Math.max(step.rateFromStart, step.sessions > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              ) : null}

              <article className="admin-analytics-panel admin-analytics-chart">
                <div className="admin-analytics-chart-head">
                  <h2>
                    Trends diarios · {formatMonthLabel(data.month)}
                  </h2>
                  <label className="admin-analytics-trend-select">
                    Métrica
                    <select
                      value={trendMetric}
                      onChange={(event) => setTrendMetric(event.target.value as TrendMetricKey)}
                    >
                      {trendOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div
                  className="admin-analytics-bars"
                  role="img"
                  aria-label={`Serie diaria de ${trendLabel}`}
                >
                  {data.daily.map((day) => {
                    const value = Number(day[trendMetric] ?? 0);
                    return (
                      <div
                        key={day.date}
                        className="admin-analytics-bar-col"
                        title={`${day.date}: ${value} ${trendLabel.toLowerCase()}`}
                      >
                        <div
                          className="admin-analytics-bar"
                          style={{
                            height: `${Math.max(4, (value / maxTrendValue) * 100)}%`
                          }}
                        />
                        <span>{day.date.slice(8)}</span>
                      </div>
                    );
                  })}
                </div>
                <small>
                  Altura relativa a <strong>{trendLabel}</strong> del mes. Cambiá la métrica para
                  explorar otra serie (estilo trends).
                </small>
              </article>

              <div className="admin-analytics-grid">
                <TopList
                  title="Páginas más vistas"
                  rows={data.topPages}
                  emptyLabel="Sin page views en el período."
                />
                <TopList
                  title="Empresas más vistas"
                  rows={data.topCompanies}
                  emptyLabel="Sin vistas de empresas todavía."
                />
                <TopList
                  title="Productos más vistos"
                  rows={data.topProducts}
                  emptyLabel="Sin vistas de productos todavía."
                />
                <TopList
                  title="Búsquedas más frecuentes"
                  rows={data.topSearches}
                  emptyLabel="Sin búsquedas en el período."
                />
                <TopList
                  title="Búsquedas sin resultados"
                  rows={data.emptySearches}
                  emptyLabel="No hubo búsquedas vacías."
                />
                <TopList
                  title="CTAs más usados"
                  rows={data.topCtas}
                  emptyLabel="Sin clics de CTA registrados."
                />
                <TopList
                  title="Recorridos (paths)"
                  rows={data.topPaths ?? []}
                  emptyLabel="Aún no hay secuencias de navegación."
                />
                <TopList
                  title="Modos de búsqueda"
                  rows={data.searchModes ?? []}
                  emptyLabel="Sin breakdown de modo."
                />
                <TopList
                  title="Dispositivos"
                  rows={data.devices ?? []}
                  emptyLabel="Sin datos de user-agent."
                />
              </div>
            </>
          ) : null}
        </div>
      </section>
    </PrivateLayout>
  );
}
