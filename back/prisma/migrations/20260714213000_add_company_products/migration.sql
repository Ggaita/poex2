-- CreateTable
CREATE TABLE "company_products" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "tariffPosition" TEXT,
    "isTariffPositionUnknown" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_products_profileId_idx" ON "company_products"("profileId");

-- CreateIndex
CREATE INDEX "company_products_tariffPosition_idx" ON "company_products"("tariffPosition");

-- AddForeignKey
ALTER TABLE "company_products" ADD CONSTRAINT "company_products_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
