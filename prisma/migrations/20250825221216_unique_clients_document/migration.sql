/*
  Warnings:

  - The values [IN_PROGRESS,COMPLETED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `quantity` on the `booking_accessories` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `booking_items` table. All the data in the column will be lost.
  - You are about to drop the column `cnpj` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `clients` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[document]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventAddress` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventTitle` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'HOLD', 'RETURNED', 'CANCELLED');
ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "clients_cnpj_key";

-- DropIndex
DROP INDEX "clients_cpf_key";

-- AlterTable
ALTER TABLE "booking_accessories" DROP COLUMN "quantity",
ADD COLUMN     "qty" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "booking_items" DROP COLUMN "quantity",
ADD COLUMN     "meters" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "eventAddress" TEXT NOT NULL,
ADD COLUMN     "eventTitle" TEXT NOT NULL,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "cnpj",
DROP COLUMN "cpf",
ADD COLUMN     "company" TEXT,
ADD COLUMN     "document" TEXT,
ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_document_key" ON "clients"("document");
