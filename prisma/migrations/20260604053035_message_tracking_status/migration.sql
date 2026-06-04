/*
  Warnings:

  - You are about to drop the column `status` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `MessageRead` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "MessageRead" DROP CONSTRAINT "MessageRead_messageId_fkey";

-- DropForeignKey
ALTER TABLE "MessageRead" DROP CONSTRAINT "MessageRead_userId_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "status";

-- DropTable
DROP TABLE "MessageRead";

-- CreateTable
CREATE TABLE "MessageTrackingStatus" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "MessageTrackingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageTrackingStatus_messageId_idx" ON "MessageTrackingStatus"("messageId");

-- CreateIndex
CREATE INDEX "MessageTrackingStatus_userId_idx" ON "MessageTrackingStatus"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTrackingStatus_messageId_userId_key" ON "MessageTrackingStatus"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTrackingStatus" ADD CONSTRAINT "MessageTrackingStatus_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTrackingStatus" ADD CONSTRAINT "MessageTrackingStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
