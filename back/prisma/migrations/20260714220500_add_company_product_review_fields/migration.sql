-- AlterTable
ALTER TABLE "company_products"
ADD COLUMN "isAccepted" BOOLEAN,
ADD COLUMN "rejectionMessage" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedBy" TEXT;

-- CreateIndex
CREATE INDEX "company_products_isAccepted_idx" ON "company_products"("isAccepted");
