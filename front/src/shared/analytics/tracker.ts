const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const VISITOR_KEY = "poex_analytics_visitor";
const SESSION_KEY = "poex_analytics_session";
const SESSION_TS_KEY = "poex_analytics_session_ts";
const SESSION_TTL_MS = 30 * 60 * 1000;

export type AnalyticsEventName =
  | "page_view"
  | "search"
  | "company_view"
  | "product_view"
  | "cta_click"
  | "inquiry_submit";

export type AnalyticsEventPayload = {
  eventName: AnalyticsEventName;
  path?: string;
  pageTitle?: string;
  searchQuery?: string;
  searchMode?: string;
  profileId?: number;
  productId?: number;
  productName?: string;
  companyName?: string;
  ctaName?: string;
  metadata?: Record<string, unknown>;
};

const randomId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readStorage = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (storage: Storage, key: string, value: string): void => {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
};

const getVisitorKey = (): string => {
  if (typeof window === "undefined") return "server";
  const existing = readStorage(localStorage, VISITOR_KEY);
  if (existing) return existing;
  const created = randomId();
  writeStorage(localStorage, VISITOR_KEY, created);
  return created;
};

const getSessionKey = (): string => {
  if (typeof window === "undefined") return "server-session";
  const now = Date.now();
  const existing = readStorage(sessionStorage, SESSION_KEY);
  const tsRaw = readStorage(sessionStorage, SESSION_TS_KEY);
  const ts = tsRaw ? Number.parseInt(tsRaw, 10) : 0;
  if (existing && Number.isFinite(ts) && now - ts < SESSION_TTL_MS) {
    writeStorage(sessionStorage, SESSION_TS_KEY, String(now));
    return existing;
  }
  const created = randomId();
  writeStorage(sessionStorage, SESSION_KEY, created);
  writeStorage(sessionStorage, SESSION_TS_KEY, String(now));
  return created;
};

const shouldSkipPath = (path: string): boolean => {
  return path.startsWith("/admin") || path.startsWith("/empresa") || path.startsWith("/login");
};

export const trackAnalyticsEvent = (payload: AnalyticsEventPayload): void => {
  if (typeof window === "undefined") return;

  const path = payload.path ?? `${window.location.pathname}${window.location.search}`;
  if (shouldSkipPath(window.location.pathname) && payload.eventName === "page_view") {
    return;
  }

  const body = {
    eventName: payload.eventName,
    path,
    pageTitle: payload.pageTitle ?? document.title,
    searchQuery: payload.searchQuery,
    searchMode: payload.searchMode,
    profileId: payload.profileId,
    productId: payload.productId,
    productName: payload.productName,
    companyName: payload.companyName,
    ctaName: payload.ctaName,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,
    sessionKey: getSessionKey(),
    visitorKey: getVisitorKey(),
    metadata: payload.metadata ?? undefined,
    occurredAt: new Date().toISOString()
  };

  const endpoint = `${API_BASE_URL}/api/public/analytics/events`;
  const json = JSON.stringify(body);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([json], { type: "application/json" });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return;
    }
  } catch {
    // fallback fetch
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true
  }).catch(() => undefined);
};

export const trackPageView = (path?: string, pageTitle?: string): void => {
  trackAnalyticsEvent({
    eventName: "page_view",
    path,
    pageTitle
  });
};

export const trackSearch = (input: {
  query: string;
  mode?: string;
  resultCount?: number;
  path?: string;
}): void => {
  const query = input.query.trim();
  if (!query) return;
  trackAnalyticsEvent({
    eventName: "search",
    path: input.path ?? "/search",
    searchQuery: query,
    searchMode: input.mode,
    metadata:
      typeof input.resultCount === "number"
        ? { resultCount: input.resultCount }
        : undefined
  });
};

export const trackCompanyView = (input: {
  profileId: number;
  companyName?: string;
  path?: string;
}): void => {
  trackAnalyticsEvent({
    eventName: "company_view",
    path: input.path ?? `/empresas/${input.profileId}`,
    profileId: input.profileId,
    companyName: input.companyName
  });
};

export const trackProductView = (input: {
  profileId?: number;
  productId?: number;
  productName: string;
  companyName?: string;
  path?: string;
}): void => {
  trackAnalyticsEvent({
    eventName: "product_view",
    path: input.path,
    profileId: input.profileId,
    productId: input.productId,
    productName: input.productName,
    companyName: input.companyName
  });
};

export const trackCtaClick = (ctaName: string, path?: string): void => {
  trackAnalyticsEvent({
    eventName: "cta_click",
    ctaName,
    path
  });
};

export const trackInquirySubmit = (input?: {
  path?: string;
  profileId?: number;
  companyName?: string;
}): void => {
  trackAnalyticsEvent({
    eventName: "inquiry_submit",
    path: input?.path,
    profileId: input?.profileId,
    companyName: input?.companyName
  });
};
