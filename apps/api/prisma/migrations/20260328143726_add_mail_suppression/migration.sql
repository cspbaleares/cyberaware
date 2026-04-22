-- CreateEnum
CREATE TYPE "MailSuppressionReason" AS ENUM ('bounce', 'complaint', 'manual_optout');

-- CreateEnum
CREATE TYPE "MailSuppressionScope" AS ENUM ('simulation', 'all');

-- CreateTable
CREATE TABLE "mail_suppressions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "MailSuppressionReason" NOT NULL,
    "scope" "MailSuppressionScope" NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_suppressions_tenantId_idx" ON "mail_suppressions"("tenantId");

-- CreateIndex
CREATE INDEX "mail_suppressions_tenantId_email_idx" ON "mail_suppressions"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "mail_suppressions_tenantId_email_scope_key" ON "mail_suppressions"("tenantId", "email", "scope");

-- AddForeignKey
ALTER TABLE "mail_suppressions" ADD CONSTRAINT "mail_suppressions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
