-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "availabilityExceptions" JSONB NOT NULL DEFAULT '[]';
