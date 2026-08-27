-- AlterEnum
ALTER TYPE "SpecialRequestKind" ADD VALUE IF NOT EXISTS 'info_request';

-- AlterTable
ALTER TABLE "special_requests" ADD COLUMN IF NOT EXISTS "profileId" INTEGER;
ALTER TABLE "special_requests" ADD COLUMN IF NOT EXISTS "productName" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "special_requests_profileId_idx" ON "special_requests"("profileId");

-- AddForeignKey
DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'special_requests_profileId_fkey'
  ) THEN
    ALTER TABLE "special_requests"
      ADD CONSTRAINT "special_requests_profileId_fkey"
      FOREIGN KEY ("profileId") REFERENCES "company_profiles"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $mig$;
