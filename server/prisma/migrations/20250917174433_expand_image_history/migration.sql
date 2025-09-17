/*
  Warnings:

  - You are about to drop the column `viewType` on the `ImageHistory` table. All the data in the column will be lost.
  - You are about to drop the column `viewedAt` on the `ImageHistory` table. All the data in the column will be lost.
  - Added the required column `action` to the `ImageHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ImageHistory" DROP CONSTRAINT "ImageHistory_userId_fkey";

-- First, add the new columns with default values
ALTER TABLE "public"."ImageHistory"
ADD COLUMN "action" TEXT DEFAULT 'view',
ADD COLUMN "description" TEXT,
ADD COLUMN "metadata" JSONB,
ADD COLUMN "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to set action based on viewType
UPDATE "public"."ImageHistory" SET "action" = "viewType" WHERE "viewType" IS NOT NULL;
UPDATE "public"."ImageHistory" SET "timestamp" = "viewedAt" WHERE "viewedAt" IS NOT NULL;
UPDATE "public"."ImageHistory" SET "description" = 'Image viewed' WHERE "action" = 'view';

-- Make userId nullable
ALTER TABLE "public"."ImageHistory" ALTER COLUMN "userId" DROP NOT NULL;

-- Make action required (remove default after data migration)
ALTER TABLE "public"."ImageHistory" ALTER COLUMN "action" SET NOT NULL;
ALTER TABLE "public"."ImageHistory" ALTER COLUMN "action" DROP DEFAULT;

-- Make timestamp required (remove default after data migration)
ALTER TABLE "public"."ImageHistory" ALTER COLUMN "timestamp" SET NOT NULL;
ALTER TABLE "public"."ImageHistory" ALTER COLUMN "timestamp" DROP DEFAULT;

-- Drop old columns
ALTER TABLE "public"."ImageHistory" DROP COLUMN "viewType";
ALTER TABLE "public"."ImageHistory" DROP COLUMN "viewedAt";

-- AddForeignKey
ALTER TABLE "public"."ImageHistory" ADD CONSTRAINT "ImageHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
