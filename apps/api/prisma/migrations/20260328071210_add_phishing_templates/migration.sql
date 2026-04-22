-- AlterTable
ALTER TABLE "PhishingSimulation" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "PhishingTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "landingUrl" TEXT,
    "htmlBody" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PhishingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhishingTemplate_tenantId_status_idx" ON "PhishingTemplate"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PhishingTemplate_tenantId_deletedAt_idx" ON "PhishingTemplate"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PhishingTemplate_tenantId_name_deletedAt_key" ON "PhishingTemplate"("tenantId", "name", "deletedAt");

-- AddForeignKey
ALTER TABLE "PhishingSimulation" ADD CONSTRAINT "PhishingSimulation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PhishingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingTemplate" ADD CONSTRAINT "PhishingTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingTemplate" ADD CONSTRAINT "PhishingTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
