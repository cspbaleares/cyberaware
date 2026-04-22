-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiskScore_tenantId_score_idx" ON "RiskScore"("tenantId", "score");

-- CreateIndex
CREATE INDEX "RiskScore_tenantId_level_idx" ON "RiskScore"("tenantId", "level");

-- CreateIndex
CREATE INDEX "RiskScore_tenantId_deletedAt_idx" ON "RiskScore"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RiskScore_tenantId_userId_key" ON "RiskScore"("tenantId", "userId");

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
