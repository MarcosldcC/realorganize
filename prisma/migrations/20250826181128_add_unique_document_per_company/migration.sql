/*
  Warnings:

  - You are about to drop the column `company` on the `clients` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code,companyId]` on the table `accessories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[document,companyId]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `equipment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,companyId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `accessories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `reminders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "products_code_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "accessories" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "company",
ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "cnpj" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "companies"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accessories_code_companyId_key" ON "accessories"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_document_companyId_key" ON "clients"("document", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_code_companyId_key" ON "equipment"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_companyId_key" ON "products"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_companyId_key" ON "users"("email", "companyId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
