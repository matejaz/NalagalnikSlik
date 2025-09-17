-- CreateTable
CREATE TABLE "public"."ImageShareToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageShareToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageShareToken_token_key" ON "public"."ImageShareToken"("token");

-- AddForeignKey
ALTER TABLE "public"."ImageShareToken" ADD CONSTRAINT "ImageShareToken_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
