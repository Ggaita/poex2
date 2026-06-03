-- CreateEnum
CREATE TYPE "ProfileEditMode" AS ENUM ('agency', 'company', 'mixed');

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER,
    "ownerUserId" INTEGER,
    "slug" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "phone" TEXT,
    "taxId" TEXT,
    "description" TEXT,
    "sector" TEXT,
    "subSector" TEXT,
    "product" TEXT,
    "keywords" TEXT,
    "tariffPosition" TEXT,
    "exportDestinations" TEXT,
    "awards" TEXT,
    "certifications" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "youtube" TEXT,
    "otherLink" TEXT,
    "address" TEXT,
    "city" TEXT,
    "googleMapsEmbed" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "editMode" "ProfileEditMode" NOT NULL DEFAULT 'mixed',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile_visibility" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profile_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile_audit_logs" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "actorUserId" INTEGER,
    "actorEmail" TEXT,
    "actorRole" "UserRole",
    "action" TEXT NOT NULL,
    "fieldKey" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profile_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_applicationId_key" ON "company_profiles"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_slug_key" ON "company_profiles"("slug");

-- CreateIndex
CREATE INDEX "company_profiles_isPublished_idx" ON "company_profiles"("isPublished");

-- CreateIndex
CREATE INDEX "company_profiles_editMode_idx" ON "company_profiles"("editMode");

-- CreateIndex
CREATE INDEX "company_profiles_companyName_idx" ON "company_profiles"("companyName");

-- CreateIndex
CREATE INDEX "company_profiles_ownerUserId_idx" ON "company_profiles"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "company_profile_visibility_profileId_fieldKey_key" ON "company_profile_visibility"("profileId", "fieldKey");

-- CreateIndex
CREATE INDEX "company_profile_visibility_profileId_idx" ON "company_profile_visibility"("profileId");

-- CreateIndex
CREATE INDEX "company_profile_audit_logs_profileId_createdAt_idx" ON "company_profile_audit_logs"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "company_profile_audit_logs_actorUserId_idx" ON "company_profile_audit_logs"("actorUserId");

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "company_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profile_visibility" ADD CONSTRAINT "company_profile_visibility_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profile_audit_logs" ADD CONSTRAINT "company_profile_audit_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profile_audit_logs" ADD CONSTRAINT "company_profile_audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
