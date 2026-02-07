/*
  Warnings:

  - You are about to drop the column `sensor` on the `SensorReading` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `SensorReading` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `SensorReading` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SensorReading" DROP COLUMN "sensor",
DROP COLUMN "unit",
DROP COLUMN "value",
ADD COLUMN     "co2" DOUBLE PRECISION,
ADD COLUMN     "nitrate" DOUBLE PRECISION,
ADD COLUMN     "ph" DOUBLE PRECISION,
ADD COLUMN     "soilMoisture" DOUBLE PRECISION,
ADD COLUMN     "temperature" DOUBLE PRECISION;

-- DropEnum
DROP TYPE "SensorType";
