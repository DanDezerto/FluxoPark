-- CreateEnum
CREATE TYPE "AccountRoleType" AS ENUM ('DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'MANAGER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentTransactionType" AS ENUM ('CHARGE', 'ADDITIONAL_CHARGE', 'REFUND');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'ANSWERED');

-- CreateEnum
CREATE TYPE "PartnerRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordDigest" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_roles" (
    "accountId" TEXT NOT NULL,
    "role" "AccountRoleType" NOT NULL,

    CONSTRAINT "account_roles_pkey" PRIMARY KEY ("accountId","role")
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "accountId" TEXT NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "accountId" TEXT NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_memberships" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "company_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parkings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "googlePlaceId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "toleranceMinutes" INTEGER NOT NULL DEFAULT 0,
    "allowsOvernight" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banUntil" TIMESTAMPTZ(3),
    "banReason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "parkings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spots" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "parking_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opening_hours" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opensAt" TIME(0) NOT NULL,
    "closesAt" TIME(0) NOT NULL,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_rates" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "minDurationMinutes" INTEGER NOT NULL,
    "maxDurationMinutes" INTEGER,
    "hourlyRate" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "parking_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "driverAccountId" TEXT,
    "vehicleId" TEXT,
    "spotId" TEXT,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "parkingNameSnapshot" TEXT NOT NULL,
    "parkingAddressSnapshot" TEXT,
    "spotLabelSnapshot" TEXT NOT NULL,
    "spotTypeSnapshot" TEXT NOT NULL,
    "spotFeaturesSnapshot" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vehiclePlateSnapshot" TEXT NOT NULL,
    "vehicleModelSnapshot" TEXT NOT NULL,
    "tariffFeatureSnapshot" TEXT NOT NULL,
    "tariffBandSnapshot" TEXT NOT NULL,
    "hourlyRateSnapshot" DECIMAL(10,2) NOT NULL,
    "initialTotalAmount" DECIMAL(10,2) NOT NULL,
    "currentTotalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "cancelledAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" "PaymentTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "paymentMethod" TEXT NOT NULL,
    "description" TEXT,
    "relatedTransactionId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "removedAt" TIMESTAMPTZ(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "driverAccountId" TEXT NOT NULL,
    "parkingId" TEXT,
    "reservationId" TEXT,
    "category" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "driverNameSnapshot" TEXT,
    "driverEmailSnapshot" TEXT,
    "parkingNameSnapshot" TEXT,
    "adminResponse" TEXT,
    "administratorId" TEXT,
    "answeredAt" TIMESTAMPTZ(3),
    "penalty" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_requests" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordDigest" TEXT NOT NULL,
    "parkingName" TEXT NOT NULL,
    "parkingAddress" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "parkingPhone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "toleranceMinutes" INTEGER NOT NULL DEFAULT 0,
    "allowsOvernight" BOOLEAN NOT NULL DEFAULT false,
    "status" "PartnerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "administratorId" TEXT,
    "resultingCompanyId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "reviewedAt" TIMESTAMPTZ(3),

    CONSTRAINT "partner_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requested_spots" (
    "id" TEXT NOT NULL,
    "partnerRequestId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "requested_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requested_opening_hours" (
    "id" TEXT NOT NULL,
    "partnerRequestId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opensAt" TIME(0) NOT NULL,
    "closesAt" TIME(0) NOT NULL,

    CONSTRAINT "requested_opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requested_rates" (
    "id" TEXT NOT NULL,
    "partnerRequestId" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "minDurationMinutes" INTEGER NOT NULL,
    "maxDurationMinutes" INTEGER,
    "hourlyRate" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "requested_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE INDEX "company_memberships_companyId_status_idx" ON "company_memberships"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "company_memberships_accountId_companyId_key" ON "company_memberships"("accountId", "companyId");

-- CreateIndex
CREATE INDEX "vehicles_plate_idx" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_accountId_plate_key" ON "vehicles"("accountId", "plate");

-- CreateIndex
CREATE UNIQUE INDEX "parkings_googlePlaceId_key" ON "parkings"("googlePlaceId");

-- CreateIndex
CREATE INDEX "parkings_companyId_active_idx" ON "parkings"("companyId", "active");

-- CreateIndex
CREATE INDEX "parking_spots_parkingId_active_idx" ON "parking_spots"("parkingId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_parkingId_label_key" ON "parking_spots"("parkingId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "opening_hours_parkingId_weekday_key" ON "opening_hours"("parkingId", "weekday");

-- CreateIndex
CREATE INDEX "parking_rates_parkingId_featureType_idx" ON "parking_rates"("parkingId", "featureType");

-- CreateIndex
CREATE UNIQUE INDEX "parking_rates_parkingId_featureType_minDurationMinutes_key" ON "parking_rates"("parkingId", "featureType", "minDurationMinutes");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_code_key" ON "reservations"("code");

-- CreateIndex
CREATE INDEX "reservations_spotId_status_startAt_endAt_idx" ON "reservations"("spotId", "status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "reservations_driverAccountId_createdAt_idx" ON "reservations"("driverAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_transactions_reservationId_createdAt_idx" ON "payment_transactions"("reservationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reservationId_key" ON "reviews"("reservationId");

-- CreateIndex
CREATE INDEX "reviews_removedAt_createdAt_idx" ON "reviews"("removedAt", "createdAt");

-- CreateIndex
CREATE INDEX "reports_driverAccountId_createdAt_idx" ON "reports"("driverAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "reports_status_createdAt_idx" ON "reports"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "partner_requests_resultingCompanyId_key" ON "partner_requests"("resultingCompanyId");

-- CreateIndex
CREATE INDEX "partner_requests_email_status_idx" ON "partner_requests"("email", "status");

-- CreateIndex
CREATE INDEX "partner_requests_cnpj_status_idx" ON "partner_requests"("cnpj", "status");

-- CreateIndex
CREATE UNIQUE INDEX "requested_spots_partnerRequestId_label_key" ON "requested_spots"("partnerRequestId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "requested_opening_hours_partnerRequestId_weekday_key" ON "requested_opening_hours"("partnerRequestId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "requested_rates_partnerRequestId_featureType_minDurationMin_key" ON "requested_rates"("partnerRequestId", "featureType", "minDurationMinutes");

-- AddForeignKey
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_rates" ADD CONSTRAINT "parking_rates_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_driverAccountId_fkey" FOREIGN KEY ("driverAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "parking_spots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_driverAccountId_fkey" FOREIGN KEY ("driverAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_administratorId_fkey" FOREIGN KEY ("administratorId") REFERENCES "admin_profiles"("accountId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_requests" ADD CONSTRAINT "partner_requests_administratorId_fkey" FOREIGN KEY ("administratorId") REFERENCES "admin_profiles"("accountId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_requests" ADD CONSTRAINT "partner_requests_resultingCompanyId_fkey" FOREIGN KEY ("resultingCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requested_spots" ADD CONSTRAINT "requested_spots_partnerRequestId_fkey" FOREIGN KEY ("partnerRequestId") REFERENCES "partner_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requested_opening_hours" ADD CONSTRAINT "requested_opening_hours_partnerRequestId_fkey" FOREIGN KEY ("partnerRequestId") REFERENCES "partner_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requested_rates" ADD CONSTRAINT "requested_rates_partnerRequestId_fkey" FOREIGN KEY ("partnerRequestId") REFERENCES "partner_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce booking overlap rules in PostgreSQL so concurrent requests cannot
-- reserve the same spot for overlapping intervals.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_valid_interval_check"
CHECK ("endAt" > "startAt" AND "endAt" <= "startAt" + INTERVAL '24 hours');

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_no_confirmed_overlap"
EXCLUDE USING gist (
    "spotId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE ("status" = 'CONFIRMED' AND "spotId" IS NOT NULL);

ALTER TABLE "payment_transactions"
ADD CONSTRAINT "payment_transactions_positive_amount_check"
CHECK ("amount" > 0);

ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_rating_range_check"
CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "opening_hours"
ADD CONSTRAINT "opening_hours_weekday_range_check"
CHECK ("weekday" BETWEEN 0 AND 6);

ALTER TABLE "requested_opening_hours"
ADD CONSTRAINT "requested_opening_hours_weekday_range_check"
CHECK ("weekday" BETWEEN 0 AND 6);

ALTER TABLE "parking_rates"
ADD CONSTRAINT "parking_rates_valid_duration_range_check"
CHECK ("minDurationMinutes" >= 0 AND ("maxDurationMinutes" IS NULL OR "maxDurationMinutes" > "minDurationMinutes"));

ALTER TABLE "requested_rates"
ADD CONSTRAINT "requested_rates_valid_duration_range_check"
CHECK ("minDurationMinutes" >= 0 AND ("maxDurationMinutes" IS NULL OR "maxDurationMinutes" > "minDurationMinutes"));
