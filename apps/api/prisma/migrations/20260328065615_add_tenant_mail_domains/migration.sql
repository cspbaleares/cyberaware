-- AlterTable
ALTER TABLE "PhishingSimulation" ADD COLUMN     "mailDomainId" TEXT;

-- CreateTable
CREATE TABLE "TenantMailDomain" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "fromEmail" TEXT,
    "fromName" TEXT,
    "replyTo" TEXT,
    "spfExpected" TEXT,
    "dkimExpected" TEXT,
    "dmarcExpected" TEXT,
    "bounceExpected" TEXT,
    "trackingExpected" TEXT,
    "spfStatus" TEXT NOT NULL DEFAULT 'pending',
    "dkimStatus" TEXT NOT NULL DEFAULT 'pending',
    "dmarcStatus" TEXT NOT NULL DEFAULT 'pending',
    "bounceStatus" TEXT NOT NULL DEFAULT 'pending',
    "trackingStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastCheckedAt" TIMESTAMP(3),
    "verificationMetadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TenantMailDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantMailDomain_tenantId_type_idx" ON "TenantMailDomain"("tenantId", "type");

-- CreateIndex
CREATE INDEX "TenantMailDomain_tenantId_status_idx" ON "TenantMailDomain"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TenantMailDomain_tenantId_deletedAt_idx" ON "TenantMailDomain"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMailDomain_tenantId_domain_type_deletedAt_key" ON "TenantMailDomain"("tenantId", "domain", "type", "deletedAt");

-- AddForeignKey
ALTER TABLE "PhishingSimulation" ADD CONSTRAINT "PhishingSimulation_mailDomainId_fkey" FOREIGN KEY ("mailDomainId") REFERENCES "TenantMailDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMailDomain" ADD CONSTRAINT "TenantMailDomain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMailDomain" ADD CONSTRAINT "TenantMailDomain_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
