import type { Request, Response } from "express";
import { createAnalyticsEvents } from "../services/analytics.service";
import {
  isAnalyticsEventName,
  type AnalyticsEventInput
} from "../types/analytics.types";

const getOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const getRequiredString = (value: unknown): string | undefined => getOptionalString(value);

const parseOptionalId = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const parseEvent = (raw: unknown): AnalyticsEventInput | null => {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  if (!isAnalyticsEventName(source.eventName)) return null;

  const sessionKey = getRequiredString(source.sessionKey);
  const visitorKey = getRequiredString(source.visitorKey);
  if (!sessionKey || !visitorKey) return null;

  const metadata =
    source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata)
      ? (source.metadata as Record<string, unknown>)
      : null;

  return {
    eventName: source.eventName,
    path: getOptionalString(source.path) ?? null,
    pageTitle: getOptionalString(source.pageTitle) ?? null,
    searchQuery: getOptionalString(source.searchQuery) ?? null,
    searchMode: getOptionalString(source.searchMode) ?? null,
    profileId: parseOptionalId(source.profileId) ?? null,
    productId: parseOptionalId(source.productId) ?? null,
    productName: getOptionalString(source.productName) ?? null,
    companyName: getOptionalString(source.companyName) ?? null,
    ctaName: getOptionalString(source.ctaName) ?? null,
    referrer: getOptionalString(source.referrer) ?? null,
    userAgent: getOptionalString(source.userAgent) ?? null,
    sessionKey,
    visitorKey,
    metadata,
    occurredAt: getOptionalString(source.occurredAt) ?? null
  };
};

export const postPublicAnalyticsEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body ?? {};
  const rawEvents = Array.isArray(body)
    ? body
    : Array.isArray((body as { events?: unknown }).events)
      ? ((body as { events: unknown[] }).events)
      : [body];

  if (rawEvents.length === 0) {
    res.status(400).json({ success: false, error: "events vacío" });
    return;
  }
  if (rawEvents.length > 50) {
    res.status(400).json({ success: false, error: "Máximo 50 eventos por request" });
    return;
  }

  const fallbackUa = getOptionalString(req.headers["user-agent"]);
  const parsed: AnalyticsEventInput[] = [];
  rawEvents.forEach((item) => {
    const event = parseEvent(item);
    if (!event) return;
    if (!event.userAgent && fallbackUa) event.userAgent = fallbackUa;
    parsed.push(event);
  });

  if (parsed.length === 0) {
    res.status(400).json({ success: false, error: "Ningún evento válido" });
    return;
  }

  try {
    const count = await createAnalyticsEvents(parsed);
    res.status(201).json({
      success: true,
      message: "Eventos registrados",
      data: { count }
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "No se pudieron registrar los eventos"
    });
  }
};
