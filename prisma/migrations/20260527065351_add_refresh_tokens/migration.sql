-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "refreshTokens" TEXT[] DEFAULT ARRAY[]::TEXT[];
