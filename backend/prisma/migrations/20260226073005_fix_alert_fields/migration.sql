-- DropForeignKey
ALTER TABLE "PriceAlert" DROP CONSTRAINT "PriceAlert_userId_fkey";

-- AlterTable
ALTER TABLE "PriceAlert" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
