import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';

export interface ScreenerFilters {
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  
  // Performance filters
  minChange?: number;
  maxChange?: number;
  minVolume?: number;
  
  // Valuation filters
  minMarketCap?: number;
  maxPE?: number;
  minPE?: number;
  maxPB?: number;
  minDividend?: number;
  minROE?: number;
  minROCE?: number;
  maxDebt?: number;
  
  // Quality filters
  minQualityScore?: number;
  moatRating?: string[];
  
  // Technical filters
  near52WeekHigh?: boolean; // Within 5% of 52W high
  near52WeekLow?: boolean;  // Within 5% of 52W low
  
  // Categorical filters
  exchanges?: string[];
  sectors?: string[];
  
  // Valuation filters
  onlyUndervalued?: boolean; // valuationGap < -15%
}

export class ScreenerService {
  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(filters: ScreenerFilters): Prisma.StockWhereInput {
    const where: Prisma.StockWhereInput = {};

    // Price range
    if (filters.minPrice || filters.maxPrice) {
      where.currentPrice = {};
      if (filters.minPrice) where.currentPrice.gte = filters.minPrice;
      if (filters.maxPrice) where.currentPrice.lte = filters.maxPrice;
    }

    // Day change
    if (filters.minChange || filters.maxChange) {
      where.dayChangePercent = {};
      if (filters.minChange) where.dayChangePercent.gte = filters.minChange;
      if (filters.maxChange) where.dayChangePercent.lte = filters.maxChange;
    }

    // Volume
    if (filters.minVolume) {
      where.volume = { gte: BigInt(filters.minVolume) };
    }

    // Market cap
    if (filters.minMarketCap) {
      where.marketCap = { gte: filters.minMarketCap };
    }

    // P/E ratio
    if (filters.minPE || filters.maxPE) {
      where.peRatio = { not: null };
      if (filters.minPE) where.peRatio = { ...where.peRatio, gte: filters.minPE };
      if (filters.maxPE) where.peRatio = { ...where.peRatio, lte: filters.maxPE };
    }

    // P/B ratio
    if (filters.maxPB) {
      where.pbRatio = { lte: filters.maxPB, not: null };
    }

    // Dividend yield
    if (filters.minDividend) {
      where.dividendYield = { gte: filters.minDividend, not: null };
    }

    // ROE
    if (filters.minROE) {
      where.roe = { gte: filters.minROE, not: null };
    }

    // ROCE
    if (filters.minROCE) {
      where.roce = { gte: filters.minROCE, not: null };
    }

    // Debt to Equity
    if (filters.maxDebt) {
      where.debtToEquity = { lte: filters.maxDebt, not: null };
    }

    // Quality score
    if (filters.minQualityScore) {
      where.qualityScore = { gte: filters.minQualityScore };
    }

    // Moat rating
    if (filters.moatRating && filters.moatRating.length > 0) {
      where.moatRating = { in: filters.moatRating };
    }

    // Exchange
    if (filters.exchanges && filters.exchanges.length > 0) {
      where.exchange = { in: filters.exchanges };
    }

    // Sector
    if (filters.sectors && filters.sectors.length > 0) {
      where.sector = { in: filters.sectors };
    }

    // Undervalued
    if (filters.onlyUndervalued) {
      where.valuationGap = { lt: -15 };
    }

    return where;
  }

  /**
   * Custom screen with filters
   */
  async screenStocks(filters: ScreenerFilters, limit: number = 50) {
    const where = this.buildWhereClause(filters);

    const stocks = await prisma.stock.findMany({
      where,
      orderBy: { marketCap: 'desc' }, // Largest first
      take: limit,
    });

    return stocks;
  }

  /**
   * PRESET: Momentum stocks (trending up with volume)
   */
  async getMomentumStocks() {
    return this.screenStocks({
      minChange: 2,        // Up 2%+
      minVolume: 1000000,  // Good volume
      minQualityScore: 5,  // Decent quality
    }, 30);
  }

  /**
   * PRESET: Value stocks (cheap + quality)
   */
  async getValueStocks() {
    return this.screenStocks({
      maxPE: 15,          // Low PE
      minDividend: 2,     // Dividend paying
      minROE: 12,         // Good returns
      minQualityScore: 6, // Quality companies
    }, 30);
  }

  /**
   * PRESET: Quality stocks (moat + high ROE)
   */
  async getQualityStocks() {
    return this.screenStocks({
      minQualityScore: 8,
      moatRating: ['NARROW', 'WIDE'],
      minROE: 15,
    }, 30);
  }

  /**
   * PRESET: Growth stocks (high revenue/profit growth)
   */
  async getGrowthStocks() {
    // Simplified: high PE + high ROE indicates growth expectations
    return this.screenStocks({
      minPE: 25,
      minROE: 18,
      maxDebt: 1.0,
    }, 30);
  }

  /**
   * PRESET: Dividend aristocrats
   */
  async getDividendStocks() {
    return this.screenStocks({
      minDividend: 3,
      minQualityScore: 7,
      maxDebt: 1.0,
    }, 30);
  }

  /**
   * PRESET: 52-week breakout stocks
   */
  async get52WeekHighs() {
    const stocks = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Stock"
      WHERE "currentPrice" >= ("high52Week" * 0.98)
      AND "high52Week" IS NOT NULL
      AND "volume" > 500000
      ORDER BY "dayChangePercent" DESC
      LIMIT 25
    `;
    return stocks;
  }

  /**
   * PRESET: Undervalued gems
   */
  async getUndervaluedStocks() {
    return this.screenStocks({
      onlyUndervalued: true,
      minQualityScore: 6,
      minROE: 12,
    }, 30);
  }
}

export const screenerService = new ScreenerService();