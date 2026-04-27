-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "bookValue" DECIMAL(10,2),
ADD COLUMN     "debtToEquity" DECIMAL(10,2),
ADD COLUMN     "eps" DECIMAL(10,2),
ADD COLUMN     "fairValue" DECIMAL(10,2),
ADD COLUMN     "intrinsicValue" DECIMAL(10,2),
ADD COLUMN     "moatRating" TEXT,
ADD COLUMN     "pegRatio" DECIMAL(10,2),
ADD COLUMN     "profit" DECIMAL(15,2),
ADD COLUMN     "qualityScore" INTEGER,
ADD COLUMN     "revenue" DECIMAL(15,2),
ADD COLUMN     "roce" DECIMAL(5,2),
ADD COLUMN     "roe" DECIMAL(5,2),
ADD COLUMN     "valuationGap" DECIMAL(5,2);

-- CreateIndex
CREATE INDEX "Stock_symbol_idx" ON "Stock"("symbol");

-- CreateIndex
CREATE INDEX "Stock_sector_idx" ON "Stock"("sector");

-- CreateIndex
CREATE INDEX "Stock_qualityScore_idx" ON "Stock"("qualityScore");
