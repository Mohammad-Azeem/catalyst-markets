/*
  Warnings:

  - You are about to drop the column `advisorFlags` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `drhpUrl` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `gmpLastUpdated` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `gmpValue` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `profitMarginAvg` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `promoterHoldingPercent` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `revenue3yrCagr` on the `IPO` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionLastUpdated` on the `IPO` table. All the data in the column will be lost.
  - You are about to alter the column `advisorScore` on the `IPO` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(3,1)`.

*/
-- DropIndex
DROP INDEX "IPO_listingDate_idx";

-- DropIndex
DROP INDEX "IPO_openDate_closeDate_idx";

-- AlterTable
ALTER TABLE "IPO" DROP COLUMN "advisorFlags",
DROP COLUMN "drhpUrl",
DROP COLUMN "gmpLastUpdated",
DROP COLUMN "gmpValue",
DROP COLUMN "profitMarginAvg",
DROP COLUMN "promoterHoldingPercent",
DROP COLUMN "revenue3yrCagr",
DROP COLUMN "subscriptionLastUpdated",
ADD COLUMN     "faceValue" DECIMAL(10,2),
ADD COLUMN     "gmpPrice" DECIMAL(10,2),
ADD COLUMN     "lastGmpUpdate" TIMESTAMP(3),
ADD COLUMN     "leadManager" TEXT,
ADD COLUMN     "minInvestment" INTEGER,
ADD COLUMN     "profit" DECIMAL(15,2),
ADD COLUMN     "promoterHolding" DECIMAL(5,2),
ADD COLUMN     "registrar" TEXT,
ADD COLUMN     "revenue" DECIMAL(15,2),
ADD COLUMN     "roe" DECIMAL(5,2),
ALTER COLUMN "debtToEquity" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "advisorScore" SET DATA TYPE DECIMAL(3,1);

-- CreateIndex
CREATE INDEX "IPO_closeDate_idx" ON "IPO"("closeDate");

-- CreateIndex
CREATE INDEX "IPO_companyName_idx" ON "IPO"("companyName");
