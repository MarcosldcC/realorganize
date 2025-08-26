/*
  Warnings:

  - Made the column `email` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `document` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "document" SET NOT NULL;
