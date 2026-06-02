-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "MediaOwnerType" AS ENUM ('PROFILE', 'MESSAGE', 'ALBUM');

-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'ALBUM';

-- DropIndex
DROP INDEX "Message_conversationId_idx";

-- DropIndex
DROP INDEX "Message_senderId_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "albumId" INTEGER,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ownerType" "MediaOwnerType" NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_ownerType_ownerId_idx" ON "Media"("ownerType", "ownerId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
