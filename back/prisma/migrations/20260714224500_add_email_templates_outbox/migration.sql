-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('prepared', 'sent', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "email_templates" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" SERIAL NOT NULL,
    "templateKey" TEXT,
    "triggerEvent" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientProfileId" INTEGER,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'prepared',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_key_key" ON "email_templates"("key");

-- CreateIndex
CREATE INDEX "email_outbox_templateKey_idx" ON "email_outbox"("templateKey");

-- CreateIndex
CREATE INDEX "email_outbox_status_createdAt_idx" ON "email_outbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "email_outbox_recipientEmail_idx" ON "email_outbox"("recipientEmail");

-- CreateIndex
CREATE INDEX "email_outbox_recipientProfileId_idx" ON "email_outbox"("recipientProfileId");

-- CreateIndex
CREATE INDEX "email_outbox_createdByUserId_idx" ON "email_outbox"("createdByUserId");

-- AddForeignKey
ALTER TABLE "email_outbox"
ADD CONSTRAINT "email_outbox_templateKey_fkey"
FOREIGN KEY ("templateKey") REFERENCES "email_templates"("key")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_outbox"
ADD CONSTRAINT "email_outbox_recipientProfileId_fkey"
FOREIGN KEY ("recipientProfileId") REFERENCES "company_profiles"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_outbox"
ADD CONSTRAINT "email_outbox_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "app_users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
