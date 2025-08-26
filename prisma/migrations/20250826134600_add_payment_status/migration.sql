-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE');

-- AlterTable
ALTER TABLE "accessories" ADD COLUMN     "occupiedQty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "occupiedQty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "occupiedMeters" INTEGER NOT NULL DEFAULT 0;
