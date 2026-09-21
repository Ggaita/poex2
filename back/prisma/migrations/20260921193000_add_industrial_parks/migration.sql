-- CreateTable
CREATE TABLE "industrial_parks" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "administration" TEXT,
    "progressStatus" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "department" TEXT,
    "yearCreated" INTEGER,
    "surfaceHa" DOUBLE PRECISION,
    "measuredPlots" INTEGER,
    "settledCompanies" TEXT,
    "infrastructure" TEXT,
    "renpiStatus" TEXT,
    "observations" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industrial_parks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "industrial_parks_slug_key" ON "industrial_parks"("slug");

-- CreateIndex
CREATE INDEX "industrial_parks_isPublished_sortOrder_idx" ON "industrial_parks"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "industrial_parks_progressStatus_idx" ON "industrial_parks"("progressStatus");

-- CreateIndex
CREATE INDEX "industrial_parks_locality_idx" ON "industrial_parks"("locality");
