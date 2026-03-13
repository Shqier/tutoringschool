-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('confirmed', 'pending', 'updated');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('availability_confirmation', 'approval_request', 'approval_resolved', 'lesson_reminder', 'payment_due', 'system');

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "availabilityConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "availabilityConfirmedForMonth" INTEGER,
ADD COLUMN     "availabilityConfirmedForYear" INTEGER,
ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_readAt_idx" ON "notifications"("readAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "teachers_availabilityStatus_idx" ON "teachers"("availabilityStatus");
