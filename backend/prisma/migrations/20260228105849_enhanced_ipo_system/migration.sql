/*
  Warnings:

  - You are about to drop the column `hniSubscription` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `qibSubscription` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `retailSubscription` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `totalSubscription` on the `IPO` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "IPO_companyName_idx";

-- AlterTable
ALTER TABLE "IPO" DROP COLUMN "hniSubscription",
DROP COLUMN "industry",
DROP COLUMN "qibSubscription",
DROP COLUMN "retailSubscription",
DROP COLUMN "totalSubscription",
ADD COLUMN     "basisAllotment" TIMESTAMP(3),
ADD COLUMN     "bhniiTimes" DECIMAL(10,2),
ADD COLUMN     "creditDate" TIMESTAMP(3),
ADD COLUMN     "employeeTimes" DECIMAL(10,2),
ADD COLUMN     "exchange" TEXT NOT NULL DEFAULT 'NSE',
ADD COLUMN     "expectedListing" TEXT,
ADD COLUMN     "freshIssue" DECIMAL(10,2),
ADD COLUMN     "lastSubUpdate" TIMESTAMP(3),
ADD COLUMN     "niiProbability" INTEGER,
ADD COLUMN     "niiTimes" DECIMAL(10,2),
ADD COLUMN     "offerForSale" DECIMAL(10,2),
ADD COLUMN     "otherTimes" DECIMAL(10,2),
ADD COLUMN     "qibProbability" INTEGER,
ADD COLUMN     "qibTimes" DECIMAL(10,2),
ADD COLUMN     "refundDate" TIMESTAMP(3),
ADD COLUMN     "retailProbability" INTEGER,
ADD COLUMN     "retailTimes" DECIMAL(10,2),
ADD COLUMN     "shniiTimes" DECIMAL(10,2),
ADD COLUMN     "totalTimes" DECIMAL(10,2),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'MAINBOARD';

-- CreateIndex
CREATE INDEX "IPO_type_idx" ON "IPO"("type");

-- CreateIndex
CREATE INDEX "IPO_openDate_closeDate_idx" ON "IPO"("openDate", "closeDate");
