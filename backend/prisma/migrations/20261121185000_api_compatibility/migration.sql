-- AlterEnum
ALTER TYPE "AccountRoleType" ADD VALUE 'PARTNER';

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_driverAccountId_fkey";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN "cpf" TEXT;

-- AlterTable
ALTER TABLE "admin_profiles" ADD COLUMN "cpf" TEXT;

-- AlterTable
ALTER TABLE "company_memberships" ADD COLUMN "legacyData" JSONB;

-- AlterTable
ALTER TABLE "parkings"
ADD COLUMN "legacyData" JSONB,
ADD COLUMN "partner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rating" DOUBLE PRECISION,
ADD COLUMN "reviewCount" INTEGER;

-- AlterTable
ALTER TABLE "partner_requests" ADD COLUMN "legacyData" JSONB;

-- AlterTable
ALTER TABLE "reports"
ADD COLUMN "legacyData" JSONB,
ALTER COLUMN "driverAccountId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "legacyData" JSONB;

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "holder" TEXT NOT NULL,
    "expiry" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "legacyData" JSONB,
    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_methods_accountId_isDefault_idx" ON "payment_methods"("accountId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_cpf_key" ON "accounts"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_cpf_key" ON "admin_profiles"("cpf");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_driverAccountId_fkey" FOREIGN KEY ("driverAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
