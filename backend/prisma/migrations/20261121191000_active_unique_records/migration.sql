-- Allow archived vehicles and spots to be re-created with their previous plate
-- or label while keeping active records unique.
DROP INDEX "vehicles_accountId_plate_key";
CREATE UNIQUE INDEX "vehicles_active_accountId_plate_key"
ON "vehicles" ("accountId", "plate")
WHERE "active" = true;

DROP INDEX "parking_spots_parkingId_label_key";
CREATE UNIQUE INDEX "parking_spots_active_parkingId_label_key"
ON "parking_spots" ("parkingId", "label")
WHERE "active" = true;

CREATE INDEX "vehicles_accountId_active_plate_idx"
ON "vehicles" ("accountId", "active", "plate");

CREATE INDEX "parking_spots_parkingId_active_label_idx"
ON "parking_spots" ("parkingId", "active", "label");
