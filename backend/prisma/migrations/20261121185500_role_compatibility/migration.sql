-- AlterTable
ALTER TABLE "admin_profiles"
ADD COLUMN "legacyId" TEXT,
ADD COLUMN "passwordDigest" TEXT;

-- AlterTable
ALTER TABLE "driver_profiles"
ADD COLUMN "legacyId" TEXT,
ADD COLUMN "passwordDigest" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_legacyId_key" ON "admin_profiles"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_legacyId_key" ON "driver_profiles"("legacyId");
