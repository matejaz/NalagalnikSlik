-- AlterTable
ALTER TABLE "public"."Image" ADD COLUMN     "encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalSize" INTEGER,
ADD COLUMN     "processedSize" INTEGER,
ADD COLUMN     "processingStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "processingTime" INTEGER,
ADD COLUMN     "thumbnailExists" BOOLEAN NOT NULL DEFAULT false;
