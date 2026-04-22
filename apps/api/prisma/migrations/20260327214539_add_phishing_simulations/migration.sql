-- CreateTable
CREATE TABLE "PhishingSimulation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PhishingSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhishingSimulationRecipient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PhishingSimulationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhishingSimulation_tenantId_status_idx" ON "PhishingSimulation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PhishingSimulation_tenantId_deletedAt_idx" ON "PhishingSimulation"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "PhishingSimulation_tenantId_scheduledAt_idx" ON "PhishingSimulation"("tenantId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "PhishingSimulation_tenantId_name_deletedAt_key" ON "PhishingSimulation"("tenantId", "name", "deletedAt");

-- CreateIndex
CREATE INDEX "PhishingSimulationRecipient_tenantId_simulationId_idx" ON "PhishingSimulationRecipient"("tenantId", "simulationId");

-- CreateIndex
CREATE INDEX "PhishingSimulationRecipient_tenantId_userId_idx" ON "PhishingSimulationRecipient"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "PhishingSimulationRecipient_tenantId_status_idx" ON "PhishingSimulationRecipient"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PhishingSimulationRecipient_tenantId_deletedAt_idx" ON "PhishingSimulationRecipient"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PhishingSimulationRecipient_simulationId_userId_key" ON "PhishingSimulationRecipient"("simulationId", "userId");

-- AddForeignKey
ALTER TABLE "PhishingSimulation" ADD CONSTRAINT "PhishingSimulation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingSimulation" ADD CONSTRAINT "PhishingSimulation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingSimulationRecipient" ADD CONSTRAINT "PhishingSimulationRecipient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingSimulationRecipient" ADD CONSTRAINT "PhishingSimulationRecipient_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "PhishingSimulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingSimulationRecipient" ADD CONSTRAINT "PhishingSimulationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
