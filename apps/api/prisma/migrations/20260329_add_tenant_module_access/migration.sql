CREATE TABLE "TenantModuleAccess" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "moduleKey" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TenantModuleAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantModuleAccess_tenantId_moduleKey_key"
ON "TenantModuleAccess"("tenantId", "moduleKey");

CREATE INDEX "TenantModuleAccess_tenantId_idx"
ON "TenantModuleAccess"("tenantId");

CREATE INDEX "TenantModuleAccess_moduleKey_idx"
ON "TenantModuleAccess"("moduleKey");

CREATE INDEX "TenantModuleAccess_isEnabled_idx"
ON "TenantModuleAccess"("isEnabled");

ALTER TABLE "TenantModuleAccess"
ADD CONSTRAINT "TenantModuleAccess_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
