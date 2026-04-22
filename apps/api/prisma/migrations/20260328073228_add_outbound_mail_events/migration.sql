-- CreateTable
CREATE TABLE "OutboundMailEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundMailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboundMailEvent_tenantId_simulationId_eventType_idx" ON "OutboundMailEvent"("tenantId", "simulationId", "eventType");

-- CreateIndex
CREATE INDEX "OutboundMailEvent_tenantId_recipientId_eventType_idx" ON "OutboundMailEvent"("tenantId", "recipientId", "eventType");

-- CreateIndex
CREATE INDEX "OutboundMailEvent_tenantId_userId_eventType_idx" ON "OutboundMailEvent"("tenantId", "userId", "eventType");

-- CreateIndex
CREATE INDEX "OutboundMailEvent_tenantId_providerMessageId_idx" ON "OutboundMailEvent"("tenantId", "providerMessageId");

-- CreateIndex
CREATE INDEX "OutboundMailEvent_tenantId_eventAt_idx" ON "OutboundMailEvent"("tenantId", "eventAt");

-- AddForeignKey
ALTER TABLE "OutboundMailEvent" ADD CONSTRAINT "OutboundMailEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMailEvent" ADD CONSTRAINT "OutboundMailEvent_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "PhishingSimulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMailEvent" ADD CONSTRAINT "OutboundMailEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "PhishingSimulationRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMailEvent" ADD CONSTRAINT "OutboundMailEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
