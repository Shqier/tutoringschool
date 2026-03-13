-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('elementary', 'high_school');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('subscription', 'pay_as_you_go');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'paused');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('subscription_monthly', 'private_lesson', 'prorated', 'refund');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentStatusEnum" AS ENUM ('active', 'overdue', 'cancelled', 'suspended');

-- CreateTable
CREATE TABLE "payment_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "type" "PlanType" NOT NULL,
    "lessonsPerMonth" INTEGER,
    "monthlyPrice" DOUBLE PRECISION,
    "lessonPrice" DOUBLE PRECISION,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "orgId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_subscriptions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "billingDay" INTEGER NOT NULL,
    "lastPaymentDate" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "reference" TEXT,
    "lessonIds" TEXT[],
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_credits" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "lessonsIncluded" INTEGER NOT NULL,
    "lessonsUsed" INTEGER NOT NULL DEFAULT 0,
    "lessonsRemaining" INTEGER NOT NULL,
    "resetDate" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_credits_pkey" PRIMARY KEY ("id")
);

-- AlterTable (add new columns)
ALTER TABLE "students" ADD COLUMN "grade" INTEGER,
ADD COLUMN "planId" TEXT,
ADD COLUMN "paymentStatus" "PaymentStatusEnum" NOT NULL DEFAULT 'active';

-- AlterTable (drop old columns)
ALTER TABLE "students" DROP COLUMN "balance",
DROP COLUMN "plan";

-- CreateIndex
CREATE INDEX "payment_plans_orgId_idx" ON "payment_plans"("orgId");

-- CreateIndex
CREATE INDEX "payment_plans_orgId_type_idx" ON "payment_plans"("orgId", "type");

-- CreateIndex
CREATE INDEX "student_subscriptions_studentId_idx" ON "student_subscriptions"("studentId");

-- CreateIndex
CREATE INDEX "student_subscriptions_orgId_idx" ON "student_subscriptions"("orgId");

-- CreateIndex
CREATE INDEX "student_subscriptions_orgId_status_idx" ON "student_subscriptions"("orgId", "status");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- CreateIndex
CREATE INDEX "payments_orgId_idx" ON "payments"("orgId");

-- CreateIndex
CREATE INDEX "payments_orgId_status_idx" ON "payments"("orgId", "status");

-- CreateIndex
CREATE INDEX "payments_dueDate_idx" ON "payments"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_credits_subscriptionId_year_month_key" ON "lesson_credits"("subscriptionId", "year", "month");

-- CreateIndex
CREATE INDEX "lesson_credits_studentId_idx" ON "lesson_credits"("studentId");

-- CreateIndex
CREATE INDEX "lesson_credits_orgId_idx" ON "lesson_credits"("orgId");

-- CreateIndex
CREATE INDEX "students_planId_idx" ON "students"("planId");

-- AddForeignKey
ALTER TABLE "student_subscriptions" ADD CONSTRAINT "student_subscriptions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subscriptions" ADD CONSTRAINT "student_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "payment_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "student_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_credits" ADD CONSTRAINT "lesson_credits_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_credits" ADD CONSTRAINT "lesson_credits_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "student_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_planId_fkey" FOREIGN KEY ("planId") REFERENCES "payment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
