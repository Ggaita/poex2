-- CreateEnum
CREATE TYPE "AnalyticsEventName" AS ENUM ('page_view', 'search', 'company_view', 'product_view', 'cta_click', 'inquiry_submit');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" SERIAL NOT NULL,
    "eventName" "AnalyticsEventName" NOT NULL,
    "path" TEXT,
    "pageTitle" TEXT,
    "searchQuery" TEXT,
    "searchMode" TEXT,
    "profileId" INTEGER,
    "productId" INTEGER,
    "productName" TEXT,
    "companyName" TEXT,
    "ctaName" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "sessionKey" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_eventName_occurredAt_idx" ON "analytics_events"("eventName", "occurredAt");
CREATE INDEX "analytics_events_occurredAt_idx" ON "analytics_events"("occurredAt");
CREATE INDEX "analytics_events_sessionKey_occurredAt_idx" ON "analytics_events"("sessionKey", "occurredAt");
CREATE INDEX "analytics_events_visitorKey_occurredAt_idx" ON "analytics_events"("visitorKey", "occurredAt");
CREATE INDEX "analytics_events_profileId_occurredAt_idx" ON "analytics_events"("profileId", "occurredAt");
CREATE INDEX "analytics_events_productId_occurredAt_idx" ON "analytics_events"("productId", "occurredAt");
CREATE INDEX "analytics_events_searchQuery_idx" ON "analytics_events"("searchQuery");