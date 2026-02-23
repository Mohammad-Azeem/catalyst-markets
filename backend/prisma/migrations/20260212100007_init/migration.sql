-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "fullName" TEXT,
    "phoneNumber" TEXT,
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "proExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPO" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "issueSizeCr" DECIMAL(10,2) NOT NULL,
    "priceBandLow" DECIMAL(10,2) NOT NULL,
    "priceBandHigh" DECIMAL(10,2) NOT NULL,
    "openDate" TIMESTAMP(3) NOT NULL,
    "closeDate" TIMESTAMP(3) NOT NULL,
    "listingDate" TIMESTAMP(3),
    "lotSize" INTEGER NOT NULL,
    "gmpValue" DECIMAL(10,2),
    "gmpPercent" DECIMAL(5,2),
    "gmpLastUpdated" TIMESTAMP(3),
    "retailSubscription" DECIMAL(10,2),
    "hniSubscription" DECIMAL(10,2),
    "qibSubscription" DECIMAL(10,2),
    "totalSubscription" DECIMAL(10,2),
    "subscriptionLastUpdated" TIMESTAMP(3),
    "drhpUrl" TEXT,
    "revenue3yrCagr" DECIMAL(5,2),
    "profitMarginAvg" DECIMAL(5,2),
    "debtToEquity" DECIMAL(5,2),
    "promoterHoldingPercent" DECIMAL(5,2),
    "peRatio" DECIMAL(10,2),
    "industry" TEXT,
    "advisorVerdict" TEXT,
    "advisorScore" INTEGER,
    "advisorFlags" TEXT[],
    "advisorReasoning" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IPO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpoApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ipoId" INTEGER NOT NULL,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "lotCount" INTEGER,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpoApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "marketCap" DECIMAL(15,2),
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "dayChange" DECIMAL(10,2) NOT NULL,
    "dayChangePercent" DECIMAL(5,2) NOT NULL,
    "volume" BIGINT NOT NULL,
    "avgVolume20Day" BIGINT,
    "high52Week" DECIMAL(10,2),
    "low52Week" DECIMAL(10,2),
    "sma20" DECIMAL(10,2),
    "sma50" DECIMAL(10,2),
    "sma200" DECIMAL(10,2),
    "rsi" DECIMAL(5,2),
    "peRatio" DECIMAL(10,2),
    "pbRatio" DECIMAL(10,2),
    "dividendYield" DECIMAL(5,2),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioStock" (
    "id" SERIAL NOT NULL,
    "portfolioId" INTEGER NOT NULL,
    "stockId" INTEGER NOT NULL,
    "buyPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buyDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Watchlist',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistStock" (
    "id" SERIAL NOT NULL,
    "watchlistId" INTEGER NOT NULL,
    "stockId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "stockId" INTEGER NOT NULL,
    "targetPrice" DECIMAL(10,2) NOT NULL,
    "condition" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" TIMESTAMP(3),
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FearGreedHistory" (
    "id" SERIAL NOT NULL,
    "market" TEXT NOT NULL DEFAULT 'INDIA',
    "score" INTEGER NOT NULL,
    "sentiment" TEXT NOT NULL,
    "vixValue" DECIMAL(5,2),
    "putCallRatio" DECIMAL(5,2),
    "marketMomentum" TEXT,
    "fiiNetFlow" DECIMAL(10,2),
    "advanceDecline" DECIMAL(5,2),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FearGreedHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MomentumScreenerResult" (
    "id" SERIAL NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "stockName" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "entryPrice" DECIMAL(10,2) NOT NULL,
    "stopLoss" DECIMAL(10,2) NOT NULL,
    "target" DECIMAL(10,2) NOT NULL,
    "riskRewardRatio" DECIMAL(3,2) NOT NULL,
    "rsiValue" DECIMAL(5,2),
    "volumeSurge" DECIMAL(5,2),
    "priceAboveSma20" BOOLEAN NOT NULL DEFAULT false,
    "priceAboveSma50" BOOLEAN NOT NULL DEFAULT false,
    "screenerType" TEXT NOT NULL DEFAULT 'MOMENTUM',
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MomentumScreenerResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiLog" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "IPO_openDate_closeDate_idx" ON "IPO"("openDate", "closeDate");

-- CreateIndex
CREATE INDEX "IPO_listingDate_idx" ON "IPO"("listingDate");

-- CreateIndex
CREATE INDEX "IPO_status_idx" ON "IPO"("status");

-- CreateIndex
CREATE INDEX "IpoApplication_userId_idx" ON "IpoApplication"("userId");

-- CreateIndex
CREATE INDEX "IpoApplication_ipoId_idx" ON "IpoApplication"("ipoId");

-- CreateIndex
CREATE UNIQUE INDEX "IpoApplication_userId_ipoId_key" ON "IpoApplication"("userId", "ipoId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE INDEX "Stock_exchange_symbol_idx" ON "Stock"("exchange", "symbol");

-- CreateIndex
CREATE INDEX "Stock_lastUpdated_idx" ON "Stock"("lastUpdated");

-- CreateIndex
CREATE INDEX "Stock_exchange_idx" ON "Stock"("exchange");

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "PortfolioStock_portfolioId_idx" ON "PortfolioStock"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioStock_portfolioId_stockId_key" ON "PortfolioStock"("portfolioId", "stockId");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE INDEX "WatchlistStock_watchlistId_idx" ON "WatchlistStock"("watchlistId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistStock_watchlistId_stockId_key" ON "WatchlistStock"("watchlistId", "stockId");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_isActive_idx" ON "PriceAlert"("userId", "isActive");

-- CreateIndex
CREATE INDEX "PriceAlert_stockId_isActive_idx" ON "PriceAlert"("stockId", "isActive");

-- CreateIndex
CREATE INDEX "FearGreedHistory_market_recordedAt_idx" ON "FearGreedHistory"("market", "recordedAt");

-- CreateIndex
CREATE INDEX "FearGreedHistory_recordedAt_idx" ON "FearGreedHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "MomentumScreenerResult_scannedAt_exchange_idx" ON "MomentumScreenerResult"("scannedAt", "exchange");

-- CreateIndex
CREATE INDEX "MomentumScreenerResult_screenerType_scannedAt_idx" ON "MomentumScreenerResult"("screenerType", "scannedAt");

-- CreateIndex
CREATE INDEX "ApiLog_createdAt_idx" ON "ApiLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiLog_endpoint_statusCode_idx" ON "ApiLog"("endpoint", "statusCode");

-- AddForeignKey
ALTER TABLE "IpoApplication" ADD CONSTRAINT "IpoApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpoApplication" ADD CONSTRAINT "IpoApplication_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "IPO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioStock" ADD CONSTRAINT "PortfolioStock_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioStock" ADD CONSTRAINT "PortfolioStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistStock" ADD CONSTRAINT "WatchlistStock_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistStock" ADD CONSTRAINT "WatchlistStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
