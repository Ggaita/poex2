-- CreateEnum
CREATE TYPE "InvestmentOpportunityType" AS ENUM ('inversiones', 'exportaciones', 'proyectos_productivos', 'licitaciones', 'alianzas_comerciales', 'proveedores', 'parques_industriales');

-- CreateEnum
CREATE TYPE "InvestmentOpportunityStatus" AS ENUM ('licitacion_vigente', 'proxima_licitacion', 'licitacion_cerrada');

-- CreateEnum
CREATE TYPE "InvestmentAssetKind" AS ENUM ('gallery', 'document');

-- CreateEnum
CREATE TYPE "InvestmentInquiryStatus" AS ENUM ('pending', 'in_review', 'resolved', 'rejected');

-- CreateTable
CREATE TABLE "investment_opportunities" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "type" "InvestmentOpportunityType" NOT NULL,
    "status" "InvestmentOpportunityStatus" NOT NULL,
    "estimatedInvestment" TEXT,
    "mainImageUrl" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_opportunity_assets" (
    "id" SERIAL NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "kind" "InvestmentAssetKind" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_opportunity_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_inquiries" (
    "id" SERIAL NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "requesterCompany" TEXT,
    "message" TEXT NOT NULL,
    "status" "InvestmentInquiryStatus" NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "reviewedByUserId" INTEGER,
    "reviewedByEmail" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "investment_opportunities_slug_key" ON "investment_opportunities"("slug");

-- CreateIndex
CREATE INDEX "investment_opportunities_isPublished_sortOrder_idx" ON "investment_opportunities"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "investment_opportunities_isFeatured_idx" ON "investment_opportunities"("isFeatured");

-- CreateIndex
CREATE INDEX "investment_opportunities_type_idx" ON "investment_opportunities"("type");

-- CreateIndex
CREATE INDEX "investment_opportunities_status_idx" ON "investment_opportunities"("status");

-- CreateIndex
CREATE INDEX "investment_opportunity_assets_opportunityId_kind_sortOrder_idx" ON "investment_opportunity_assets"("opportunityId", "kind", "sortOrder");

-- CreateIndex
CREATE INDEX "investment_inquiries_status_createdAt_idx" ON "investment_inquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "investment_inquiries_opportunityId_idx" ON "investment_inquiries"("opportunityId");

-- CreateIndex
CREATE INDEX "investment_inquiries_requesterEmail_idx" ON "investment_inquiries"("requesterEmail");

-- CreateIndex
CREATE INDEX "investment_inquiries_reviewedByUserId_idx" ON "investment_inquiries"("reviewedByUserId");

-- AddForeignKey
ALTER TABLE "investment_opportunity_assets" ADD CONSTRAINT "investment_opportunity_assets_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "investment_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_inquiries" ADD CONSTRAINT "investment_inquiries_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "investment_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_inquiries" ADD CONSTRAINT "investment_inquiries_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;