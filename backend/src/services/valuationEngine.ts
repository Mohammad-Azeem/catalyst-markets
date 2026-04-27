import prisma from '../db/prisma';
import logger from '../utils/logger';

interface ValuationResult {
  intrinsicValue: number;
  fairValue: number;
  valuationGap: number;
  recommendation: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
  qualityScore: number;
  moatRating: 'NONE' | 'NARROW' | 'WIDE';
}

export class ValuationEngine {
  /**
   * Calculate intrinsic value using Benjamin Graham formula
   * IV = EPS × (8.5 + 2g) × 4.4 / Y
   * Where: g = growth rate, Y = current yield on AAA bonds (~7% for India)
   */
  calculateGrahamValue(eps: number, growthRate: number = 15): number {
    if (eps <= 0) return 0;
    const bondYield = 7.0; // India AAA bond yield
    return eps * (8.5 + 2 * growthRate) * 4.4 / bondYield;
  }

  /**
   * Calculate fair value using industry average PE
   */
  calculatePEBasedValue(eps: number, sectorPE: number = 20): number {
    if (eps <= 0) return 0;
    return eps * sectorPE;
  }

  /**
   * Calculate quality score (0-10) based on fundamentals
   */
  calculateQualityScore(metrics: {
    roe?: number;
    roce?: number;
    debtToEquity?: number;
    peRatio?: number;
    dividendYield?: number;
  }): number {
    let score = 5; // Base score

    // ROE (3 points max)
    if (metrics.roe) {
      if (metrics.roe >= 20) score += 3;
      else if (metrics.roe >= 15) score += 2;
      else if (metrics.roe >= 10) score += 1;
      else if (metrics.roe < 5) score -= 1;
    }

    // ROCE (2 points max)
    if (metrics.roce) {
      if (metrics.roce >= 20) score += 2;
      else if (metrics.roce >= 15) score += 1;
      else if (metrics.roce < 10) score -= 1;
    }

    // Debt to Equity (2 points max)
    if (metrics.debtToEquity !== undefined) {
      if (metrics.debtToEquity < 0.5) score += 2;
      else if (metrics.debtToEquity < 1.0) score += 1;
      else if (metrics.debtToEquity > 2.0) score -= 2;
    }

    // PE Ratio (1 point max)
    if (metrics.peRatio) {
      if (metrics.peRatio < 15) score += 1;
      else if (metrics.peRatio > 40) score -= 1;
    }

    // Dividend Yield (1 point max)
    if (metrics.dividendYield && metrics.dividendYield >= 2) {
      score += 1;
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Determine moat rating based on ROE consistency and market position
   */
  calculateMoatRating(roe: number, roce: number, marketCap: number): 'NONE' | 'NARROW' | 'WIDE' {
    // Simplified moat calculation
    // Wide moat: High ROE + ROCE, large market cap
    // Narrow moat: Good ROE/ROCE but smaller scale
    // No moat: Low returns

    const avgReturn = (roe + roce) / 2;
    const isLargeCap = marketCap > 50000; // > 50,000 Cr

    if (avgReturn >= 20 && isLargeCap) return 'WIDE';
    if (avgReturn >= 15) return 'NARROW';
    return 'NONE';
  }

  /**
   * Complete valuation analysis for a stock
   */
  async analyzeStock(stockId: number): Promise<ValuationResult | null> {
    try {
      const stock = await prisma.stock.findUnique({
        where: { id: stockId },
      });

      if (!stock || !stock.eps || !stock.currentPrice) {
        logger.warn(`Insufficient data for valuation: Stock ${stockId}`);
        return null;
      }

      const currentPrice = Number(stock.currentPrice);
      const eps = Number(stock.eps);
      const roe = stock.roe ? Number(stock.roe) : 0;
      const roce = stock.roce ? Number(stock.roce) : 0;
      const marketCap = stock.marketCap ? Number(stock.marketCap) : 0;

      // Calculate intrinsic value (Graham)
      const intrinsicValue = this.calculateGrahamValue(eps);

      // Calculate fair value (PE-based)
      const sectorAvgPE = 22; // Can be dynamic per sector
      const fairValue = this.calculatePEBasedValue(eps, sectorAvgPE);

      // Average both methods
      const combinedFairValue = (intrinsicValue + fairValue) / 2;

      // Calculate valuation gap
      const valuationGap = ((currentPrice - combinedFairValue) / combinedFairValue) * 100;

      // Recommendation
      let recommendation: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
      if (valuationGap < -20) recommendation = 'UNDERVALUED';
      else if (valuationGap > 20) recommendation = 'OVERVALUED';
      else recommendation = 'FAIRLY_VALUED';

      // Quality score
      const qualityScore = this.calculateQualityScore({
        roe,
        roce,
        debtToEquity: stock.debtToEquity ? Number(stock.debtToEquity) : undefined,
        peRatio: stock.peRatio ? Number(stock.peRatio) : undefined,
        dividendYield: stock.dividendYield ? Number(stock.dividendYield) : undefined,
      });

      // Moat rating
      const moatRating = this.calculateMoatRating(roe, roce, marketCap);

      // Update stock in database
      await prisma.stock.update({
        where: { id: stockId },
        data: {
          intrinsicValue: intrinsicValue,
          fairValue: combinedFairValue,
          valuationGap: valuationGap,
          qualityScore: qualityScore,
          moatRating: moatRating,
        },
      });

      logger.info(`Valuation complete: ${stock.symbol} - Gap: ${valuationGap.toFixed(1)}%`);

      return {
        intrinsicValue: Number(intrinsicValue.toFixed(2)),
        fairValue: Number(combinedFairValue.toFixed(2)),
        valuationGap: Number(valuationGap.toFixed(2)),
        recommendation,
        qualityScore,
        moatRating,
      };
    } catch (error) {
      logger.error(`Valuation error for stock ${stockId}:`, error);
      return null;
    }
  }

  /**
   * Batch analyze all stocks with sufficient data
   */
  async analyzeAllStocks(): Promise<number> {
    const stocks = await prisma.stock.findMany({
      where: {
        AND: [
          { eps: { not: null } },
          { eps: { gt: 0} },
        ],
        //eps: { not: null },
        //currentPrice: { not: null },
      },
    });

    let analyzed = 0;

    for (const stock of stocks) {
      const result = await this.analyzeStock(stock.id);
      if (result) analyzed++;
      
      // Rate limit
      await new Promise(r => setTimeout(r, 100));
    }

    logger.info(`✅ Analyzed ${analyzed}/${stocks.length} stocks`);
    return analyzed;
  }
}

export const valuationEngine = new ValuationEngine();