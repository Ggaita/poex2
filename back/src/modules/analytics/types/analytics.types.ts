export const analyticsEventNames = [
  "page_view",
  "search",
  "company_view",
  "product_view",
  "cta_click",
  "inquiry_submit"
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export const isAnalyticsEventName = (value: unknown): value is AnalyticsEventName => {
  return typeof value === "string" && (analyticsEventNames as readonly string[]).includes(value);
};

export type AnalyticsEventInput = {
  eventName: AnalyticsEventName;
  path?: string | null;
  pageTitle?: string | null;
  searchQuery?: string | null;
  searchMode?: string | null;
  profileId?: number | null;
  productId?: number | null;
  productName?: string | null;
  companyName?: string | null;
  ctaName?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  sessionKey: string;
  visitorKey: string;
  metadata?: Record<string, unknown> | null;
  occurredAt?: string | null;
};

export type AnalyticsNamedCount = {
  key: string;
  label: string;
  count: number;
};

export type AnalyticsDailyPoint = {
  date: string;
  pageViews: number;
  visitors: number;
  searches: number;
  companyViews: number;
  productViews: number;
  ctaClicks: number;
  inquirySubmits: number;
};

export type AnalyticsFunnelStep = {
  key: string;
  label: string;
  sessions: number;
  /** % respecto al primer paso del funnel (0–100). */
  rateFromStart: number;
  /** % respecto al paso anterior (0–100). */
  rateFromPrevious: number;
};

export type AnalyticsFunnel = {
  id: string;
  label: string;
  description: string;
  steps: AnalyticsFunnelStep[];
};

export type AnalyticsPathCount = {
  key: string;
  label: string;
  count: number;
};

export type AnalyticsLast24h = {
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

export type AnalyticsSummary = {
  from: string;
  to: string;
  month: string;
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
  daily: AnalyticsDailyPoint[];
  /** Serie multi-métrica (mismo daily, expuesta para el selector de trends). */
  trendMetrics: Array<{
    key: keyof Omit<AnalyticsDailyPoint, "date">;
    label: string;
  }>;
  funnel: AnalyticsFunnel;
  topPaths: AnalyticsPathCount[];
  searchModes: AnalyticsNamedCount[];
  devices: AnalyticsNamedCount[];
  last24h: AnalyticsLast24h;
  topPages: AnalyticsNamedCount[];
  topCompanies: AnalyticsNamedCount[];
  topProducts: AnalyticsNamedCount[];
  topSearches: AnalyticsNamedCount[];
  emptySearches: AnalyticsNamedCount[];
  topCtas: AnalyticsNamedCount[];
};
