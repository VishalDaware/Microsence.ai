/*
  Warnings:

  - The values [LIGHT] on the enum `SensorType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SensorType_new" AS ENUM ('SOIL_MOISTURE', 'TEMPERATURE', 'CO2', 'NITRATE', 'PH');
ALTER TABLE "SensorReading" ALTER COLUMN "sensor" TYPE "SensorType_new" USING ("sensor"::text::"SensorType_new");
ALTER TYPE "SensorType" RENAME TO "SensorType_old";
ALTER TYPE "SensorType_new" RENAME TO "SensorType";
DROP TYPE "public"."SensorType_old";
COMMIT;
