-- CreateEnum
CREATE TYPE "SpecialRequestKind" AS ENUM ('special_offer', 'required_product');

-- CreateEnum
CREATE TYPE "SpecialRequestStatus" AS ENUM ('pending', 'in_review', 'forwarded', 'resolved', 'rejected');

-- CreateTable
CREATE TABLE "special_requests" (
    "id" SERIAL NOT NULL,
    "kind" "SpecialRequestKind" NOT NULL,
    "sourceQuery" TEXT,
    "requestedProduct" TEXT NOT NULL,
    "details" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "requesterCompany" TEXT,
    "status" "SpecialRequestStatus" NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "reviewedByUserId" INTEGER,
    "reviewedByEmail" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "special_requests_status_createdAt_idx" ON "special_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "special_requests_requesterEmail_idx" ON "special_requests"("requesterEmail");

-- CreateIndex
CREATE INDEX "special_requests_reviewedByUserId_idx" ON "special_requests"("reviewedByUserId");

-- AddForeignKey
ALTER TABLE "special_requests" ADD CONSTRAINT "special_requests_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
