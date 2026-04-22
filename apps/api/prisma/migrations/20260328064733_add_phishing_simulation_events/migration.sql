-- CreateTable
CREATE TABLE "PhishingSimulationEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhishingSimulationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhishingSimulationEvent_tenantId_userId_eventType_idx" ON "PhishingSimulationEvent"("tenantId", "userId", "eventType");

-- CreateIndex
CREATE INDEX "PhishingSimulationEvent_tenantId_simulationId_eventType_idx" ON "PhishingSimulationEvent"("tenantId", "simulationId", "eventType");

-- CreateIndex
CREATE INDEX "PhishingSimulationEvent_tenantId_recipientId_eventType_idx" ON "PhishingSimulationEvent"("tenantId", "recipientId", "eventType");

-- CreateIndex
CREATE INDEX "PhishingSimulationEvent_tenantId_eventAt_idx" ON "PhishingSimulationEvent"("tenantId", "eventAt");

-- AddForeignKey
ALTER TABLE "PhishingSimulationEvent" ADD CONSTRAINT "PhishingSimulationEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingSimulationEvent" ADD CONSTRAINT "PhishingSimulationEvent_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "PhishingSimulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingSimulationEvent" ADD CONSTRAINT "PhishingSimulationEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "PhishingSimulationRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingSimulationEvent" ADD CONSTRAINT "PhishingSimulationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
