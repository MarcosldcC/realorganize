-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'EQUIPMENT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'EQUIPMENT_UPDATED';

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "totalQty" INTEGER NOT NULL DEFAULT 0,
    "pricePerUnit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_equipment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "booking_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_code_key" ON "equipment"("code");

-- AddForeignKey
ALTER TABLE "booking_equipment" ADD CONSTRAINT "booking_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_equipment" ADD CONSTRAINT "booking_equipment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
