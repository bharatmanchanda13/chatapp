/*
  Warnings:

  - You are about to drop the column `isEmailVerify` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isPhoneVerify` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isEmailVerify",
DROP COLUMN "isPhoneVerify",
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false;
