-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_CANCELLED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'CONTRACT_DOWNLOADED', 'REMINDER_CREATED', 'REMINDER_COMPLETED', 'REMINDER_DELETED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'ACCESSORY_CREATED', 'ACCESSORY_UPDATED');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "clientId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
