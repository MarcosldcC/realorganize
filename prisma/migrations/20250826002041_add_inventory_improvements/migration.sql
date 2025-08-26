/*
  Warnings:

  - The values [CONTRACT_DOWNLOADED,REMINDER_CREATED,REMINDER_COMPLETED,REMINDER_DELETED] on the enum `ActivityType` will be removed. If these variants are still used in the database, this will fail.
  - The values [HOLD,RETURNED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bookingId` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `eventAddress` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `company_settings` table. All the data in the column will be lost.
  - You are about to drop the column `document` on the `company_settings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `company_settings` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - Added the required column `message` to the `reminders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActivityType_new" AS ENUM ('BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_CANCELLED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'ACCESSORY_CREATED', 'ACCESSORY_UPDATED', 'EQUIPMENT_CREATED', 'EQUIPMENT_UPDATED', 'SYSTEM_UPDATE', 'USER_LOGIN', 'USER_LOGOUT');
ALTER TABLE "activities" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "ActivityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_clientId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_userId_fkey";

-- DropForeignKey
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_clientId_fkey";

-- DropForeignKey
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_userId_fkey";

-- DropIndex
DROP INDEX "clients_document_key";

-- DropIndex
DROP INDEX "clients_email_key";

-- AlterTable
ALTER TABLE "accessories" ADD COLUMN     "category" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "bookingId",
DROP COLUMN "clientId";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "eventAddress",
DROP COLUMN "paymentStatus",
DROP COLUMN "totalPrice",
DROP COLUMN "userId",
ADD COLUMN     "totalValue" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "logoUrl",
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "company_settings" DROP COLUMN "createdAt",
DROP COLUMN "document",
DROP COLUMN "updatedAt",
ADD COLUMN     "cnpj" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "maintenanceDate" TIMESTAMP(3),
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "warrantyExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "reminders" DROP COLUMN "bookingId",
DROP COLUMN "clientId",
DROP COLUMN "description",
DROP COLUMN "isCompleted",
DROP COLUMN "isRecurring",
DROP COLUMN "recurrence",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "message" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "Role";
