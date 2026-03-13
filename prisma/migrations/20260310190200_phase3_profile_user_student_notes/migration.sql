-- AlterTable
ALTER TABLE "students" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "notifications" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "phone" TEXT;
