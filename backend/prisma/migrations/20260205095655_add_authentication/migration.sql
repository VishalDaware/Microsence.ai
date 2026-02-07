/*
  Warnings:

  - Added the required column `userId` to the `Field` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SensorReading` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SensorReading" DROP CONSTRAINT "SensorReading_fieldId_fkey";

-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SensorReading" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Field_userId_idx" ON "Field"("userId");

-- CreateIndex
CREATE INDEX "SensorReading_fieldId_idx" ON "SensorReading"("fieldId");

-- CreateIndex
CREATE INDEX "SensorReading_userId_idx" ON "SensorReading"("userId");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
