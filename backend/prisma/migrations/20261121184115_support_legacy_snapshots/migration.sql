-- AlterTable
ALTER TABLE "partner_requests" ALTER COLUMN "companyName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reservations" ALTER COLUMN "vehiclePlateSnapshot" DROP NOT NULL,
ALTER COLUMN "vehicleModelSnapshot" DROP NOT NULL,
ALTER COLUMN "tariffBandSnapshot" DROP NOT NULL;
