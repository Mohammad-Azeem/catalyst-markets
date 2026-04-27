-- CreateTable
CREATE TABLE "MarketSentiment" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fearGreedScore" INTEGER NOT NULL,
    "marketMomentum" DECIMAL(5,2) NOT NULL,
    "volatilityIndex" DECIMAL(5,2) NOT NULL,
    "putCallRatio" DECIMAL(5,3) NOT NULL,
    "advanceDecline" DECIMAL(5,2) NOT NULL,
    "sentiment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSentiment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketSentiment_date_key" ON "MarketSentiment"("date");

-- CreateIndex
CREATE INDEX "MarketSentiment_date_idx" ON "MarketSentiment"("date");
